const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
import config from '../api/config.json';
const Client = require('../api/schema.js');

//Create MongoDB Database with Name MongooseTest
mongoose.connect(config.url);

var corsOptions = {
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'error:'))
db.once('open', function () {
    console.log("connection established");
});

function createClient(name, addresses) {
    const client = new Client({
        _id: new mongoose.Types.ObjectId(),
        Name: name,
        Addresses: addresses
    });
    client.save(function (err) {
        if (err) {
            console.log("Error: " + err)
        }
    });
    return client
}

async function addClient(req, res) {
    const body = req.body;
    console.log(body);
    if (body.Name && body.Addresses) {
        const client = await createClient(body.Name, body.Addresses)
        if (client) {
            res.json(client);
            return
        }
    }
    res.status(500).json({ error: "no bueno" })
}

function deleteClient(req, res) {
    console.log("endpoint delete hit");
    const body = req.body;
    console.log(req.headers);
    console.log(req.body);
    if (body._id) {
        Client.deleteOne(body, (err) => {
            if (err) {
                res.status(404).json({ error: err })
            } else {
                res.json({ message: "deleted", client: body })
            }
        })
    } else {
        res.status(500).json({ error: "no bueno" })
    }
}

function getClients(req, res) {
    Client.find((err, clients) => {
        if (err) {
            console.log("error retrieving client: " + err)
            res.status(500).json({ error: "no bueno" })
        } else {
            res.json(clients);
        }
    });
}

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.post("/clients", cors(), addClient);
app.post("/clients/delete", cors(), deleteClient)
app.get("/clients", cors(), getClients)
app.options('/clients/', cors())
app.options('/clients/delete', cors())

export default {
    handler: app,
    path: '/api'
}
