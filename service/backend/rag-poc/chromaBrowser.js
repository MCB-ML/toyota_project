import 'dotenv/config'
import express from 'express'
import { COLLECTIONS, getClient } from './chromaClient.js'

const app = express()
const PORT = Number(process.env.CHROMA_BROWSER_PORT || 3002)
const KNOWN_COLLECTIONS = Object.values(COLLECTIONS)

function clampNumber(value, fallback, min, max) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, Math.min(max, Math.trunc(parsed)))
}

function rowsFromResult(result) {
  return (result.ids || []).map((id, index) => ({
    id,
    document: result.documents?.[index] || '',
    metadata: result.metadatas?.[index] || null,
  }))
}

async function getCollection(name) {
  return getClient().getCollection({ name })
}

app.get('/api/collections', async (req, res) => {
  const collections = []

  for (const name of KNOWN_COLLECTIONS) {
    try {
      const collection = await getCollection(name)
      collections.push({ name, status: 'ok', count: await collection.count() })
    } catch (err) {
      collections.push({ name, status: 'missing', count: null, message: err.message })
    }
  }

  res.json({ collections })
})

app.get('/api/collections/:name', async (req, res) => {
  try {
    const limit = clampNumber(req.query.limit, 25, 1, 200)
    const offset = clampNumber(req.query.offset, 0, 0, 100000)
    const collection = await getCollection(req.params.name)
    const count = await collection.count()
    const result = await collection.get({
      limit,
      offset,
      include: ['documents', 'metadatas'],
    })

    res.json({
      name: req.params.name,
      count,
      limit,
      offset,
      rows: rowsFromResult(result),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

app.get('/healthz', (req, res) => {
  res.json({ ok: true })
})

app.get('/', (req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Chroma Browser</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #101114;
      --panel: #17191f;
      --line: #2a2f3a;
      --text: #f3f5f7;
      --muted: #9aa4b2;
      --accent: #5aa9ff;
      --accent-2: #46d39a;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--text);
    }
    header {
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 18px;
      border-bottom: 1px solid var(--line);
      background: #13151a;
    }
    header h1 {
      margin: 0;
      font-size: 17px;
      font-weight: 700;
      letter-spacing: 0;
    }
    main {
      display: grid;
      grid-template-columns: 260px 1fr;
      min-height: calc(100vh - 56px);
    }
    aside {
      border-right: 1px solid var(--line);
      background: var(--panel);
      padding: 12px;
    }
    button, input {
      border: 1px solid var(--line);
      background: #20242c;
      color: var(--text);
      border-radius: 6px;
      font: inherit;
    }
    button {
      cursor: pointer;
      padding: 8px 10px;
    }
    button:hover { border-color: var(--accent); }
    input {
      width: 86px;
      padding: 7px 8px;
    }
    .collection {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin: 0 0 8px;
      text-align: left;
    }
    .collection.active {
      border-color: var(--accent);
      background: #1d2a38;
    }
    .name {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .count {
      color: var(--accent-2);
      font-variant-numeric: tabular-nums;
    }
    section {
      min-width: 0;
      padding: 14px;
    }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .toolbar .title {
      font-weight: 700;
      margin-right: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      border: 1px solid var(--line);
      background: var(--panel);
    }
    th, td {
      border-bottom: 1px solid var(--line);
      border-right: 1px solid var(--line);
      padding: 9px;
      vertical-align: top;
      text-align: left;
      font-size: 13px;
    }
    th {
      position: sticky;
      top: 0;
      z-index: 1;
      background: #1f2733;
      color: #dce8f7;
    }
    th:nth-child(1), td:nth-child(1) { width: 260px; }
    th:nth-child(2), td:nth-child(2) { width: 48%; }
    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      line-height: 1.45;
    }
    .muted { color: var(--muted); }
    .error {
      border: 1px solid #8e3434;
      background: #321c1f;
      padding: 10px;
      border-radius: 6px;
      color: #ffd0d0;
    }
  </style>
</head>
<body>
  <header>
    <h1>Chroma Browser</h1>
    <div class="muted" id="status">loading</div>
  </header>
  <main>
    <aside id="collections"></aside>
    <section>
      <div class="toolbar">
        <div class="title" id="title">Select a collection</div>
        <label class="muted">offset <input id="offset" type="number" min="0" value="0"></label>
        <label class="muted">limit <input id="limit" type="number" min="1" max="200" value="25"></label>
        <button id="prev">Prev</button>
        <button id="next">Next</button>
        <button id="reload">Reload</button>
      </div>
      <div id="content" class="muted">컬렉션을 선택하세요.</div>
    </section>
  </main>
  <script>
    const state = { collection: null, collections: [], count: 0 }
    const els = {
      status: document.querySelector('#status'),
      collections: document.querySelector('#collections'),
      title: document.querySelector('#title'),
      offset: document.querySelector('#offset'),
      limit: document.querySelector('#limit'),
      prev: document.querySelector('#prev'),
      next: document.querySelector('#next'),
      reload: document.querySelector('#reload'),
      content: document.querySelector('#content'),
    }

    function setStatus(text) { els.status.textContent = text }
    function escapeJson(value) { return JSON.stringify(value, null, 2) }
    async function fetchJson(url) {
      const res = await fetch(url)
      const body = await res.json()
      if (!res.ok) throw new Error(body.message || res.statusText)
      return body
    }
    function renderCollections() {
      els.collections.textContent = ''
      for (const item of state.collections) {
        const button = document.createElement('button')
        button.className = 'collection' + (item.name === state.collection ? ' active' : '')
        button.onclick = () => {
          state.collection = item.name
          els.offset.value = '0'
          renderCollections()
          loadRows()
        }
        const name = document.createElement('span')
        name.className = 'name'
        name.textContent = item.name
        const count = document.createElement('span')
        count.className = 'count'
        count.textContent = item.count ?? item.status
        button.append(name, count)
        els.collections.append(button)
      }
    }
    function renderRows(data) {
      state.count = data.count
      els.title.textContent = data.name + ' (' + data.count + ')'
      if (!data.rows.length) {
        els.content.innerHTML = '<div class="muted">No rows for this page.</div>'
        return
      }
      const table = document.createElement('table')
      const thead = document.createElement('thead')
      thead.innerHTML = '<tr><th>ID</th><th>Document</th><th>Metadata</th></tr>'
      const tbody = document.createElement('tbody')
      for (const row of data.rows) {
        const tr = document.createElement('tr')
        const id = document.createElement('td')
        const doc = document.createElement('td')
        const meta = document.createElement('td')
        const idPre = document.createElement('pre')
        const docPre = document.createElement('pre')
        const metaPre = document.createElement('pre')
        idPre.textContent = row.id
        docPre.textContent = row.document
        metaPre.textContent = escapeJson(row.metadata)
        id.append(idPre)
        doc.append(docPre)
        meta.append(metaPre)
        tr.append(id, doc, meta)
        tbody.append(tr)
      }
      table.append(thead, tbody)
      els.content.textContent = ''
      els.content.append(table)
    }
    async function loadCollections() {
      setStatus('loading collections')
      const data = await fetchJson('/api/collections')
      state.collections = data.collections
      if (!state.collection && data.collections.length) state.collection = data.collections[0].name
      renderCollections()
      setStatus('ready')
      if (state.collection) await loadRows()
    }
    async function loadRows() {
      if (!state.collection) return
      try {
        setStatus('loading rows')
        const limit = Number(els.limit.value) || 25
        const offset = Number(els.offset.value) || 0
        const data = await fetchJson('/api/collections/' + encodeURIComponent(state.collection) + '?limit=' + limit + '&offset=' + offset)
        renderRows(data)
        setStatus('ready')
      } catch (err) {
        els.content.innerHTML = ''
        const div = document.createElement('div')
        div.className = 'error'
        div.textContent = err.message
        els.content.append(div)
        setStatus('error')
      }
    }
    els.reload.onclick = () => loadRows()
    els.prev.onclick = () => {
      const limit = Number(els.limit.value) || 25
      const offset = Math.max(0, (Number(els.offset.value) || 0) - limit)
      els.offset.value = String(offset)
      loadRows()
    }
    els.next.onclick = () => {
      const limit = Number(els.limit.value) || 25
      const offset = (Number(els.offset.value) || 0) + limit
      els.offset.value = String(offset)
      loadRows()
    }
    loadCollections().catch(err => {
      els.content.textContent = err.message
      setStatus('error')
    })
  </script>
</body>
</html>`)
})

app.listen(PORT, () => {
  console.log(`Chroma Browser running on http://localhost:${PORT}`)
})
