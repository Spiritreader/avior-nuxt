import { timeStamp } from 'console';

const express = require('express');
const app = express();
const http = require('http');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
import config from '../api/config.json';
//Create MongoDB Database with Name MongooseTest
mongoose.connect(config.url)
const clientDocument = "RegisteredClient"

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'error:'))
db.once('open', function () {
    console.log("connection established");
});
const clientSchema = new mongoose.Schema({
    Name: { type: String, required: true, unique: true },
    Address: { type: String, required: true }
});
const Client = mongoose.model(clientDocument, clientSchema, "registered_client")

function createClient(name, address) {
    const client = new Client({
        Name: name,
        Address: address
    });
    client.save(function (err) {
        if (err) {
            console.log("Error: " + err)
        }
    });
    return client
}

async function addClient(req, res) {
    const body = req.body
    if (body.Name && body.Address) {
        const client = await createClient(body.Name, body.Address)
        if (client) {
            res.json(client);
            return
        }
    }
    res.status(500).json({ error: "no bueno" })
}

function deleteClient(req, res) {
    const body = req.body
    if (body.Name && body.Address) {
        Client.deleteOne(body, (err) => {
            if (err) {
                res.status(500).json({ error: err })
            } else {
                res.json({ message: "deleted", client: body })
            }
        })
    }

}

function getClients(req, res) {
    Client.find((err, clients) => {
        console.log("error retrieving client: " + err)
        if (err) {
            res.status(500).json({ error: "no bueno" })
        } else {
            res.json(clients);
        }
    });
}

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.post("/clients", addClient);
app.delete("/clients", deleteClient)
app.get("/clients", getClients)

export default {
    handler: app,
    path: '/api'
}