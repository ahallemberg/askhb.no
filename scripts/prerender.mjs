import { readFile, writeFile, rm } from 'node:fs/promises'

/*
 * Runs after the client build and the SSR build. Imports the server bundle,
 * renders the portfolio with live R2 data, and rewrites dist/index.html so the
 * delivered page carries the content, the dehydrated query state and the
 * JSON-LD block. Any failure exits non-zero: failing the deploy is better than
 * shipping the empty shell this project exists to remove.
 */
const INDEX_PATH = new URL('../dist/index.html', import.meta.url)
const SSR_OUT_DIR = new URL('../dist-ssr/', import.meta.url)
const SSR_BUNDLE = new URL('../dist-ssr/entry-prerender.js', import.meta.url)

// JSON destined for inline script elements: escape `<` so no payload can
// terminate the element early.
const inlineJson = (value) => JSON.stringify(value).replaceAll('<', '\\u003c')

const { render } = await import(SSR_BUNDLE.href)
const { html, dehydratedState, jsonLd } = await render()

if (!html.includes(String(jsonLd.name))) {
    throw new Error('Prerendered markup does not contain the owner name -- it likely rendered the loading screen instead of content')
}

let indexHtml = await readFile(INDEX_PATH, 'utf8')

const rootMarker = '<div id="root"></div>'
if (!indexHtml.includes(rootMarker)) {
    throw new Error('dist/index.html has no empty root element to fill -- did the client build output change?')
}

indexHtml = indexHtml.replace(rootMarker, `<div id="root">${html}</div>`)

const jsonLdScript = `<script type="application/ld+json">${inlineJson(jsonLd)}</script>`
indexHtml = indexHtml.replace('</head>', `${jsonLdScript}\n  </head>`)

const stateScript = `<script id="portfolio-state" type="application/json">${inlineJson(dehydratedState)}</script>`
indexHtml = indexHtml.replace('</body>', `${stateScript}\n  </body>`)

await writeFile(INDEX_PATH, indexHtml)
await rm(SSR_OUT_DIR, { recursive: true, force: true })

console.log(`Prerendered dist/index.html with ${html.length} bytes of markup`)
