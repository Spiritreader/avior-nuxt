const mongoose = require("mongoose");

const clientDocument = "RegisteredClient"
const clientSchema = new mongoose.Schema({
    Name: { type: String, required: true },
    Addresses: { type: Array, required: true }
});
module.exports = mongoose.model(clientDocument, clientSchema, "registered_client")