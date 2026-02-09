const RDF_TYPE_IRI = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'

function tokenize(line) {
  const tokens = []
  const regex = /"(?:\\"|[^"])*"(?:@[a-zA-Z-]+)?(?:\^\^<[^>]+>)?|<[^>]+>|[;,.]|[^\s]+/g
  let match
  while ((match = regex.exec(line)) !== null) {
    const token = match[0].trim()
    if (!token) continue
    tokens.push(token)
  }
  return tokens
}

function parsePrefixes(query) {
  const prefixes = {}
  const prefixRegex = /PREFIX\s+([A-Za-z][\w-]*):\s*<([^>]+)>/gi
  let match
  while ((match = prefixRegex.exec(query)) !== null) {
    prefixes[match[1]] = match[2]
  }
  const withoutPrefixes = query.replace(prefixRegex, '')
  return { prefixes, body: withoutPrefixes }
}

function parseSelectClause(query) {
  const selectMatch = query.match(/SELECT\s+(DISTINCT\s+|REDUCED\s+)?([^{]+)WHERE/i)
  if (!selectMatch) throw new Error('Unsupported SPARQL query: missing SELECT/WHERE block.')
  const variables = []
  const varRegex = /\?([A-Za-z_][\w-]*)/g
  let match
  while ((match = varRegex.exec(selectMatch[2])) !== null) {
    variables.push(match[1])
  }
  return { variables }
}

function parseWhereTriples(query) {
  const whereMatch = query.match(/WHERE\s*\{([\s\S]+?)\}/i)
  if (!whereMatch) throw new Error('Unsupported SPARQL query: missing WHERE clause.')
  const body = whereMatch[1]
  const withoutComments = body.replace(/#[^\n]*\n/g, ' ').replace(/#[^\n]*$/g, ' ')
  if (/(OPTIONAL|FILTER|UNION|GRAPH|MINUS|BIND|VALUES)\b/i.test(withoutComments)) {
    throw new Error('Simple SPARQL filter supports basic triple patterns only (no OPTIONAL/FILTER/UNION).')
  }
  const tokens = tokenize(withoutComments)
  const entries = []

  let i = 0
  while (i < tokens.length) {
    const subjectToken = tokens[i++]
    if (!subjectToken || subjectToken === '.' || subjectToken === ';' || subjectToken === ',') continue
    if (i >= tokens.length) break
    let predicateToken = tokens[i++]

    while (i < tokens.length) {
      if (!predicateToken || predicateToken === '.' || predicateToken === ';' || predicateToken === ',') break
      const objectToken = tokens[i++]
      if (!objectToken || objectToken === '.' || objectToken === ';' || objectToken === ',') {
        break
      }
      entries.push({
        subject: parseToken(subjectToken),
        predicate: parseToken(predicateToken),
        object: parseToken(objectToken),
      })

      const separator = tokens[i]
      if (separator === ',') {
        i += 1
        continue
      }
      if (separator === ';') {
        i += 1
        if (i < tokens.length) predicateToken = tokens[i++]
        continue
      }
      if (separator === '.') {
        i += 1
        break
      }
      if (!separator) break
      i += 1
      break
    }
  }

  if (!entries.length) throw new Error('Unsupported SPARQL query: no triple patterns found.')
  return entries
}

function parseLimit(query) {
  const limitMatch = query.match(/LIMIT\s+(\d+)/i)
  return limitMatch ? Number.parseInt(limitMatch[1], 10) : Infinity
}

function parseToken(token) {
  if (token === 'a') {
    return { type: 'namedNode', value: RDF_TYPE_IRI }
  }
  if (token.startsWith('?')) {
    return { type: 'variable', value: token.slice(1) }
  }
  if (token.startsWith('<') && token.endsWith('>')) {
    return { type: 'namedNode', value: token.slice(1, -1) }
  }
  if (token.startsWith('_:')) {
    return { type: 'blankNode', value: token }
  }
  if (token.startsWith('"')) {
    const literalMatch = token.match(/^"((?:\\"|[^"])*)"(?:@([a-zA-Z-]+))?(?:\^\^<([^>]+)>)?$/)
    const value = literalMatch ? literalMatch[1].replace(/\\"/g, '"') : token.slice(1, -1)
    return {
      type: 'literal',
      value,
      lang: literalMatch ? literalMatch[2] || null : null,
      datatype: literalMatch ? literalMatch[3] || null : null,
    }
  }
  const colonIndex = token.indexOf(':')
  if (colonIndex > 0) {
    return { type: 'prefixed', value: token }
  }
  if (/^[+-]?\d+(\.\d+)?$/.test(token)) {
    return { type: 'literal', value: token }
  }
  return { type: 'namedNode', value: token }
}

function expandTerm(term, prefixes) {
  if (term.type === 'prefixed') {
    const [prefix, local] = term.value.split(':')
    if (!prefixes[prefix]) throw new Error(`Unknown prefix: ${prefix}`)
    return { type: 'namedNode', value: prefixes[prefix] + local }
  }
  return term
}

function matchTerm(term, value, isLiteral, bindings) {
  if (term.type === 'variable') {
    const existing = bindings[term.value]
    if (existing) {
      if (existing.value !== value) return false
      return true
    }
    bindings[term.value] = { value, isLiteral }
    return true
  }
  if (term.type === 'namedNode' || term.type === 'blankNode') {
    return value === term.value
  }
  if (term.type === 'literal') {
    return isLiteral && value === term.value
  }
  return false
}

function matchPattern(triple, pattern, bindings, prefixes) {
  const expandedPattern = {
    subject: expandTerm(pattern.subject, prefixes),
    predicate: expandTerm(pattern.predicate, prefixes),
    object: expandTerm(pattern.object, prefixes),
  }
  const nextBindings = { ...bindings }
  if (!matchTerm(expandedPattern.subject, triple.s, false, nextBindings)) return null
  if (!matchTerm(expandedPattern.predicate, triple.p, false, nextBindings)) return null
  if (!matchTerm(expandedPattern.object, triple.o, triple.oIsLiteral, nextBindings)) return null
  return { bindings: nextBindings, pattern: expandedPattern }
}

function resolveValue(term, binding, fallback) {
  if (term.type === 'variable') {
    const data = binding[term.value]
    return data ? data.value : fallback
  }
  return term.value
}

function resolveLiteralFlag(term, binding, fallback) {
  if (term.type === 'variable') {
    const data = binding[term.value]
    return data ? Boolean(data.isLiteral) : fallback
  }
  return term.type === 'literal'
}

export function filterTriplesWithQuery(triples, queryText) {
  if (!queryText?.trim()) return triples
  const { prefixes, body } = parsePrefixes(queryText)
  const { variables } = parseSelectClause(body)
  if (!variables.includes('s') || !variables.includes('p') || !variables.includes('o')) {
    throw new Error('Simple SPARQL filter only supports queries selecting ?s, ?p, and ?o.')
  }
  const patterns = parseWhereTriples(body)
  const limit = parseLimit(body)

  const results = []

  function search(index, bindings) {
    if (results.length >= limit) return
    if (index >= patterns.length) {
      results.push(bindings)
      return
    }
    const pattern = patterns[index]
    for (const triple of triples) {
      const matched = matchPattern(triple, pattern, bindings, prefixes)
      if (!matched) continue
      search(index + 1, matched.bindings)
      if (results.length >= limit) break
    }
  }

  search(0, {})

  if (!results.length) return []

  const primaryPattern = patterns[0]
  const expandedPrimary = {
    subject: expandTerm(primaryPattern.subject, prefixes),
    predicate: expandTerm(primaryPattern.predicate, prefixes),
    object: expandTerm(primaryPattern.object, prefixes),
  }

  const seen = new Set()
  const tripleResults = []

  results.slice(0, limit).forEach(binding => {
    const sVal = resolveValue(expandedPrimary.subject, binding, expandedPrimary.subject.value)
    const pVal = resolveValue(expandedPrimary.predicate, binding, expandedPrimary.predicate.value)
    const oVal = resolveValue(expandedPrimary.object, binding, expandedPrimary.object.value)
    const oIsLiteral = resolveLiteralFlag(expandedPrimary.object, binding, expandedPrimary.object.type === 'literal')
    const key = `${sVal}|${pVal}|${oVal}|${oIsLiteral ? 'L' : 'R'}`
    if (seen.has(key)) return
    seen.add(key)
    tripleResults.push({
      s: sVal,
      p: pVal,
      o: oVal,
      oIsLiteral,
      oLabel: oVal,
    })
  })

  return tripleResults
}
