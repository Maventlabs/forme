import assert from 'node:assert/strict'
import test from 'node:test'
import { createEmptyCanvasDocument, createNodeFromBlock, insertNode } from '@forme/design-ir'
import { escapeXml, renderCanvasJson, renderCanvasSvg } from './export-artifact'

function canvas() {
  const container = createNodeFromBlock('container', { label: 'Hero' })
  let document = insertNode(createEmptyCanvasDocument(), container)
  const heading = createNodeFromBlock('heading', { label: 'Title', parentId: container.id, props: { text: 'Wireframe <title> & "quotes"' } })
  document = insertNode(document, heading)
  return { document, containerId: container.id, headingId: heading.id }
}

test('SVG export produces a real grayscale artifact that contains the canvas nodes', () => {
  const { document, containerId, headingId } = canvas()
  const svg = renderCanvasSvg(document, { projectName: 'FORME export', breakpoint: 'desktop' })

  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)
  assert.match(svg, /<\/svg>$/)
  assert.ok(svg.includes(`data-node-id="${containerId}"`), 'export must include the container node')
  assert.ok(svg.includes(`data-node-id="${headingId}"`), 'export must include the nested heading node')
  assert.match(svg, /width="1440"/, 'desktop export must use the desktop frame width')
  assert.match(svg, /fill="#ECECEC"|fill="#F2F2F2"/, 'wireframe export must stay grayscale')
  assert.ok(!svg.includes('#7D070B'), 'export must not contain the crimson brand color')
})

test('SVG export escapes project content so it cannot inject markup', () => {
  const { document } = canvas()
  const svg = renderCanvasSvg(document, { projectName: 'x', breakpoint: 'desktop' })
  assert.ok(!svg.includes('<title>'), 'raw markup from node text must not be emitted unescaped')
  assert.ok(svg.includes('&lt;title&gt;'), 'node text must be XML escaped')
  assert.ok(svg.includes('&amp;'), 'ampersands must be escaped')
  assert.equal(escapeXml(`<a href="x">'`), '&lt;a href=&quot;x&quot;&gt;&apos;')
})

test('SVG export honours the requested breakpoint width', () => {
  const { document } = canvas()
  assert.match(renderCanvasSvg(document, { projectName: 'x', breakpoint: 'mobile' }), /width="390"/)
  assert.match(renderCanvasSvg(document, { projectName: 'x', breakpoint: 'tablet' }), /width="768"/)
})

test('JSON export reflects the persisted canvas and is parseable', () => {
  const { document, headingId } = canvas()
  const json = JSON.parse(renderCanvasJson(document, { name: 'My project', revision: 7 })) as {
    format: string
    project: { name: string; revision: number }
    rootIds: string[]
    nodes: Record<string, { props: Record<string, unknown> }>
  }

  assert.equal(json.format, 'forme-design-ir')
  assert.equal(json.project.name, 'My project')
  assert.equal(json.project.revision, 7)
  assert.equal(json.nodes[headingId]?.props.text, 'Wireframe <title> & "quotes"')
  assert.ok(json.rootIds.length > 0)
})

test('export rejects a malformed canvas instead of emitting a broken artifact', () => {
  assert.throws(() => renderCanvasSvg({ nodes: 'not-an-object' }, { projectName: 'x' }))
  assert.throws(() => renderCanvasJson({ nodes: 'not-an-object' }, { name: 'x', revision: 0 }))
})