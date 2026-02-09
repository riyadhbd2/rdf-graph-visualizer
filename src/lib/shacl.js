const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
const SHACL = 'http://www.w3.org/ns/shacl#'

function buildSubjectIndex(triples = []) {
  const subjects = new Map()
  const types = new Map()

  for (const triple of triples) {
    if (!subjects.has(triple.s)) {
      subjects.set(triple.s, { predicates: new Map(), triples: [] })
    }
    const entry = subjects.get(triple.s)
    entry.triples.push(triple)
    if (!entry.predicates.has(triple.p)) entry.predicates.set(triple.p, [])
    entry.predicates.get(triple.p).push(triple)

    if (triple.p === RDF_TYPE) {
      if (!types.has(triple.s)) types.set(triple.s, new Set())
      types.get(triple.s).add(triple.o)
    }
  }

  return { subjects, types }
}

function getObjects(subjectMap, subject, predicate) {
  const entry = subjectMap.get(subject)
  if (!entry) return []
  const pred = entry.predicates.get(predicate)
  if (!pred) return []
  return pred.map(triple => triple.o)
}

function parseShapes(shapesTriples) {
  const subjects = new Map()
  for (const triple of shapesTriples) {
    if (!subjects.has(triple.s)) subjects.set(triple.s, [])
    subjects.get(triple.s).push(triple)
  }

  const nodeShapes = []

  for (const [subject, triples] of subjects.entries()) {
    const hasNodeShapeType = triples.some(
      t => t.p === RDF_TYPE && t.o === `${SHACL}NodeShape`
    )
    if (!hasNodeShapeType) continue

    const targetClasses = triples
      .filter(t => t.p === `${SHACL}targetClass`)
      .map(t => t.o)

    const propertyTriples = triples.filter(t => t.p === `${SHACL}property`)
    const propertyShapes = []

    for (const propTriple of propertyTriples) {
      const propNodeId = propTriple.o
      const propEntries = subjects.get(propNodeId)
      if (!propEntries) continue

      const pathTriple = propEntries.find(t => t.p === `${SHACL}path`)
      if (!pathTriple || !pathTriple.o) continue
      const propertyShape = {
        path: pathTriple.o,
        minCount: undefined,
        maxCount: undefined,
        class: undefined,
        message: undefined,
      }

      const minCountTriple = propEntries.find(t => t.p === `${SHACL}minCount`)
      if (minCountTriple) {
        const value = Number.parseInt(minCountTriple.o, 10)
        if (Number.isFinite(value)) propertyShape.minCount = value
      }

      const maxCountTriple = propEntries.find(t => t.p === `${SHACL}maxCount`)
      if (maxCountTriple) {
        const value = Number.parseInt(maxCountTriple.o, 10)
        if (Number.isFinite(value)) propertyShape.maxCount = value
      }

      const classTriple = propEntries.find(t => t.p === `${SHACL}class`)
      if (classTriple) propertyShape.class = classTriple.o

      const messageTriple = propEntries.find(t => t.p === `${SHACL}message`)
      if (messageTriple) propertyShape.message = messageTriple.o

      propertyShapes.push(propertyShape)
    }

    if (!targetClasses.length && !propertyShapes.length) continue

    nodeShapes.push({
      id: subject,
      targetClasses,
      propertyShapes,
    })
  }

  return nodeShapes
}

export function validateShacl(dataTriples = [], shapeTriples = []) {
  if (!shapeTriples?.length) return null

  const nodeShapes = parseShapes(shapeTriples)
  if (!nodeShapes.length) return null

  const { subjects, types } = buildSubjectIndex(dataTriples)
  const violationsByNode = new Map()
  const messages = []
  let totalViolations = 0

  const ensureViolation = (nodeId, message) => {
    if (!violationsByNode.has(nodeId)) violationsByNode.set(nodeId, [])
    violationsByNode.get(nodeId).push(message)
    messages.push({ node: nodeId, message })
    totalViolations += 1
  }

  const nodesWithType = typeIri => {
    const result = []
    for (const [nodeId, nodeTypes] of types.entries()) {
      if (nodeTypes.has(typeIri)) result.push(nodeId)
    }
    return result
  }

  for (const shape of nodeShapes) {
    let targetNodes = []

    if (shape.targetClasses.length) {
      const aggregate = new Set()
      for (const classIri of shape.targetClasses) {
        nodesWithType(classIri).forEach(nodeId => aggregate.add(nodeId))
      }
      targetNodes = Array.from(aggregate)
    }

    if (!targetNodes.length) continue

    for (const nodeId of targetNodes) {
      const subjectEntry = subjects.get(nodeId)
      for (const propShape of shape.propertyShapes) {
        const occurrences = subjectEntry?.predicates.get(propShape.path) || []
        const count = occurrences.length
        const label = propShape.message || `Property ${propShape.path}`

        if (typeof propShape.minCount === 'number' && count < propShape.minCount) {
          ensureViolation(
            nodeId,
            `${label}: expected at least ${propShape.minCount}, found ${count}`
          )
          continue
        }
        if (typeof propShape.maxCount === 'number' && count > propShape.maxCount) {
          ensureViolation(
            nodeId,
            `${label}: expected at most ${propShape.maxCount}, found ${count}`
          )
        }
        if (propShape.class) {
          occurrences.forEach(triple => {
            const objectTypes = types.get(triple.o)
            if (!objectTypes || !objectTypes.has(propShape.class)) {
              ensureViolation(
                nodeId,
                `${label}: object ${triple.o} is not a ${propShape.class}`
              )
            }
          })
        }
      }
    }
  }

  return {
    conforms: totalViolations === 0,
    totalViolations,
    nodeViolations: violationsByNode,
    messages,
  }
}
