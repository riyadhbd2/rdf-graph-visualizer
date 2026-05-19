const JSON_MIME = 'application/sparql-results+json'
const QUERY_MIME = 'application/sparql-query'

function bindingValue(binding) {
  if (!binding) return null
  return {
    value: binding.value,
    type: binding.type,
    datatype: binding.datatype,
    lang: binding['xml:lang'] || binding.lang,
  }
}

function bindingToTriple(binding) {
  const s = bindingValue(binding.s)
  const p = bindingValue(binding.p)
  const o = bindingValue(binding.o)
  if (!s?.value || !p?.value || !o?.value) return null
  const oIsLiteral = o.type === 'literal'
  return {
    s: s.value,
    p: p.value,
    o: o.value,
    oIsLiteral,
    oLabel: oIsLiteral ? o.value : o.value,
  }
}

function makeTriple(sVal, pVal, oVal) {
  if (!sVal?.value || !pVal?.value || !oVal?.value) return null
  const oIsLiteral = oVal.type === 'literal'
  return {
    s: sVal.value,
    p: pVal.value,
    o: oVal.value,
    oIsLiteral,
    oLabel: oVal.value,
  }
}

function bindingsToTriples(data) {
  const vars = data?.head?.vars || []
  const bindings = data?.results?.bindings || []
  const triples = []

  const hasSPO = vars.includes('s') && vars.includes('p') && vars.includes('o')
  if (hasSPO) {
    bindings.forEach(b => {
      const t = bindingToTriple(b)
      if (t) triples.push(t)
    })
    return triples
  }

  if (vars.length === 3) {
    const [sv, pv, ov] = vars
    bindings.forEach(b => {
      const t = makeTriple(bindingValue(b[sv]), bindingValue(b[pv]), bindingValue(b[ov]))
      if (t) triples.push(t)
    })
    return triples
  }

  if (vars.length >= 2) {
    const subjectVar = vars[0]
    const objectVars = vars.slice(1)
    bindings.forEach(b => {
      const sVal = bindingValue(b[subjectVar])
      if (!sVal?.value) return
      objectVars.forEach(ov => {
        const oVal = bindingValue(b[ov])
        if (!oVal?.value) return
        const pVal = { value: ov, type: 'uri' }
        const t = makeTriple(sVal, pVal, oVal)
        if (t) triples.push(t)
      })
    })
    return triples
  }

  return triples
}

async function postQuery(endpoint, query) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: JSON_MIME,
      'Content-Type': QUERY_MIME,
    },
    body: query,
    mode: 'cors',
  })
  return response
}

async function getQuery(endpoint, query) {
  const url = new URL(endpoint)
  url.searchParams.set('query', query)
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: JSON_MIME,
    },
    mode: 'cors',
  })
  return response
}

export async function fetchTriplesFromEndpoint(endpoint, query) {
  const trimmedQuery = query?.trim()
  if (!trimmedQuery) throw new Error('SPARQL query is required.')

  let response
  try {
    response = await postQuery(endpoint, trimmedQuery)
    if (response.status === 405) throw new Error('Method Not Allowed')
  } catch (error) {
    response = await getQuery(endpoint, trimmedQuery)
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`SPARQL request failed (${response.status}): ${text.slice(0, 300)}`)
  }

  const data = await response.json()
  return bindingsToTriples(data)
}

export const defaultSparqlQuery = `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?s ?p ?o
WHERE {
  ?s ?p ?o .
}
LIMIT 100`
