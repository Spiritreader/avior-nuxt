const path = require('path')
const express = require('express')
const app = require('./app.js')

const PORT = process.env.PORT || 10009

// The API lives under /api. In production the built SPA is served from dist/
// and any unmatched route falls through to index.html so that client-side
// routing works on a hard refresh.
const server = express()
server.use('/api', app)

const distDir = path.join(__dirname, '..', 'dist')
server.use(express.static(distDir))
server.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`avior listening on http://0.0.0.0:${PORT}`)
})
