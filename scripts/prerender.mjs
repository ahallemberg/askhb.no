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

/*
 * All replacements insert content derived from remote R2 data, and
 * String.replace treats `$` sequences in a string replacement as substitution
 * directives -- `$&` would re-inject the matched anchor, `$$` collapses to
 * `$`. A function replacer is inserted literally, so content can never steer
 * the rewrite. The anchor must exist: a silent no-op here would ship a page
 * missing a piece this build exists to add.
 */
const replaceOnce = (haystack, anchor, buildReplacement) => {
    if (!haystack.includes(anchor)) {
        throw new Error(`dist/index.html has no ${JSON.stringify(anchor)} anchor -- did the client build output change?`)
    }

    return haystack.replace(anchor, () => buildReplacement)
}

const { render } = await import(SSR_BUNDLE.href)
const { html, dehydratedState, jsonLd } = await render()

/*
 * A populated cache renders content; an empty or mismatched one renders the
 * loading screen. Four successful queries plus a plausible markup size prove
 * the former without string-matching against React-escaped names.
 */
if (!Array.isArray(dehydratedState.queries) || dehydratedState.queries.length !== 4) {
    throw new Error(`Expected 4 dehydrated queries, got ${dehydratedState.queries?.length ?? 'none'}`)
}

if (html.length < 5000) {
    throw new Error(`Prerendered markup is implausibly small (${html.length} bytes) -- it likely rendered the loading screen instead of content`)
}

let indexHtml = await readFile(INDEX_PATH, 'utf8')

indexHtml = replaceOnce(indexHtml, '<div id="root"></div>', `<div id="root">${html}</div>`)

const jsonLdScript = `<script type="application/ld+json">${inlineJson(jsonLd)}</script>`
indexHtml = replaceOnce(indexHtml, '</head>', `${jsonLdScript}\n  </head>`)

const stateScript = `<script id="portfolio-state" type="application/json">${inlineJson(dehydratedState)}</script>`
indexHtml = replaceOnce(indexHtml, '</body>', `${stateScript}\n  </body>`)

await writeFile(INDEX_PATH, indexHtml)
await rm(SSR_OUT_DIR, { recursive: true, force: true })

console.log(`Prerendered dist/index.html with ${html.length} bytes of markup`)
