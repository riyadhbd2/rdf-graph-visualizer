const SVG_MIME = 'image/svg+xml;charset=utf-8'
const PNG_MIME = 'image/png'
const JPG_MIME = 'image/jpeg'
const PDF_MIME = 'application/pdf'

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function inferSvgSize(svg) {
  const viewBox = svg.viewBox?.baseVal
  let width = viewBox?.width || Number.parseFloat(svg.getAttribute('width')) || svg.clientWidth || 800
  let height = viewBox?.height || Number.parseFloat(svg.getAttribute('height')) || svg.clientHeight || 600
  if (!Number.isFinite(width) || width <= 0) width = 800
  if (!Number.isFinite(height) || height <= 0) height = 600
  return { width, height }
}

function serializeSvg(svg) {
  const clone = svg.cloneNode(true)
  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  }
  if (!clone.getAttribute('xmlns:xlink')) {
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
  }
  return new XMLSerializer().serializeToString(clone)
}

async function rasterizeSvg(svgString, width, height, mimeType, backgroundColor) {
  const svgBlob = new Blob([svgString], { type: SVG_MIME })
  const svgUrl = URL.createObjectURL(svgBlob)
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = event => reject(new Error('Failed to load SVG for rasterization.'))
      img.src = svgUrl
    })

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas 2D context unavailable.')

    if (backgroundColor) {
      context.fillStyle = backgroundColor
      context.fillRect(0, 0, width, height)
    }

    context.drawImage(image, 0, 0, width, height)

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(result => {
        if (result) resolve(result)
        else reject(new Error('Failed to encode canvas.'))
      }, mimeType, mimeType === JPG_MIME ? 0.92 : undefined)
    })

    return { blob, canvas }
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}

function createPdfFromJpeg(jpegBuffer, width, height) {
  const encoder = new TextEncoder()
  const parts = []
  let offset = 0
  const offsets = {}

  const addBytes = bytes => {
    const chunk = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
    parts.push(chunk)
    offset += chunk.length
  }

  const addString = str => {
    addBytes(encoder.encode(str))
  }

  const beginObject = id => {
    offsets[id] = offset
    addString(`${id} 0 obj\n`)
  }

  const endObject = () => {
    addString('endobj\n')
  }

  addString('%PDF-1.3\n')

  beginObject(1)
  addString('<< /Type /Catalog /Pages 2 0 R >>\n')
  endObject()

  beginObject(2)
  addString('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n')
  endObject()

  const pxToPt = value => (value * 72) / 96
  const ptWidth = pxToPt(width)
  const ptHeight = pxToPt(height)

  beginObject(3)
  addString(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptWidth.toFixed(2)} ${ptHeight.toFixed(2)}] ` +
      '/Resources << /ProcSet [/PDF /ImageC] /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\n'
  )
  endObject()

  beginObject(4)
  addString(
    `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB ` +
      `/BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBuffer.byteLength} >>\n`
  )
  addString('stream\n')
  addBytes(new Uint8Array(jpegBuffer))
  addString('\nendstream\n')
  endObject()

  const contentStream = `q ${ptWidth.toFixed(2)} 0 0 ${ptHeight.toFixed(2)} 0 0 cm /Im0 Do Q\n`
  const contentBytes = encoder.encode(contentStream)

  beginObject(5)
  addString(`<< /Length ${contentBytes.length} >>\n`)
  addString('stream\n')
  addBytes(contentBytes)
  addString('\nendstream\n')
  endObject()

  const xrefOffset = offset
  addString('xref\n0 6\n')
  addString('0000000000 65535 f \n')
  for (let i = 1; i <= 5; i++) {
    const pos = offsets[i] || 0
    addString(`${String(pos).padStart(10, '0')} 00000 n \n`)
  }
  addString('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n')
  addString(`${xrefOffset}\n%%EOF`)

  const totalLength = parts.reduce((sum, chunk) => sum + chunk.length, 0)
  const output = new Uint8Array(totalLength)
  let pointer = 0
  parts.forEach(chunk => {
    output.set(chunk, pointer)
    pointer += chunk.length
  })

  return new Blob([output], { type: PDF_MIME })
}

export async function exportSvgElement(svg, format, filenameBase = 'rdf-graph') {
  if (!svg) throw new Error('SVG element not found.')
  const formatLower = format.toLowerCase()
  const nameBase = filenameBase.replace(/\s+/g, '-').toLowerCase()
  const { width, height } = inferSvgSize(svg)
  const svgString = serializeSvg(svg)

  switch (formatLower) {
    case 'svg': {
      const blob = new Blob([svgString], { type: SVG_MIME })
      downloadBlob(blob, `${nameBase}.svg`)
      return
    }
    case 'png': {
      const { blob } = await rasterizeSvg(svgString, width, height, PNG_MIME)
      downloadBlob(blob, `${nameBase}.png`)
      return
    }
    case 'jpg':
    case 'jpeg': {
      const { blob } = await rasterizeSvg(svgString, width, height, JPG_MIME, '#ffffff')
      downloadBlob(blob, `${nameBase}.jpg`)
      return
    }
    case 'pdf': {
      const { blob } = await rasterizeSvg(svgString, width, height, JPG_MIME, '#ffffff')
      const buffer = await blob.arrayBuffer()
      const pdfBlob = createPdfFromJpeg(buffer, width, height)
      downloadBlob(pdfBlob, `${nameBase}.pdf`)
      return
    }
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}
