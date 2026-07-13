const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const Client = require('./schema.js')

const MONGO_URL = process.env.MONGO_URL || 'mongodb://192.168.178.75:27017/Avior'

// serverSelectionTimeoutMS bounds the initial connect. bufferTimeoutMS bounds
// queries issued while disconnected: Mongoose buffers those, so they never
// reach server selection and would otherwise hang for its 10s default.
// The .catch is what keeps an unreachable database from killing the process.
mongoose
  .connect(MONGO_URL, { serverSelectionTimeoutMS: 5000, bufferTimeoutMS: 5000 })
  .catch(err => console.error('mongo initial connection failed:', err.message))

const db = mongoose.connection
db.on('error', console.error.bind(console, 'mongo error:'))
db.once('open', () => console.log(`mongo connected: ${MONGO_URL}`))

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ optionsSuccessStatus: 200 }))

app.get('/clients', async (req, res) => {
  try {
    const clients = await Client.find()
    res.json(clients)
  } catch (err) {
    console.error('error retrieving clients:', err)
    res.status(500).json({ error: 'failed to retrieve clients' })
  }
})

app.post('/clients', async (req, res) => {
  // Express 5 leaves req.body undefined (not {}) when no parseable body is
  // sent, so destructuring it directly throws on a bodyless request.
  const { Name, Addresses } = req.body || {}
  if (!Name || !Addresses) {
    res.status(400).json({ error: 'Name and Addresses are required' })
    return
  }
  try {
    const client = new Client({
      _id: new mongoose.Types.ObjectId(),
      Name,
      Addresses,
    })
    await client.save()
    res.json(client)
  } catch (err) {
    console.error('error creating client:', err)
    res.status(500).json({ error: 'failed to create client' })
  }
})

app.post('/clients/delete', async (req, res) => {
  const { _id } = req.body || {}
  if (!_id) {
    res.status(400).json({ error: '_id is required' })
    return
  }
  try {
    await Client.deleteOne({ _id })
    res.json({ message: 'deleted', client: req.body })
  } catch (err) {
    console.error('error deleting client:', err)
    res.status(404).json({ error: 'failed to delete client' })
  }
})

app.use((req, res) => {
  res.status(404).json({ error: 'not found' })
})

// Without this, Express's default handler answers in HTML — malformed JSON
// would return an HTML 400, and any thrown error an HTML 500 with a stack
// trace. This API only ever speaks JSON.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('unhandled api error:', err)
  const status = err.status || err.statusCode || 500
  res.status(status).json({ error: status === 400 ? 'malformed request' : 'internal error' })
})

module.exports = app
