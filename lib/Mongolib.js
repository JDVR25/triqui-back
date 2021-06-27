const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const url = process.env.mongourl;

const dbName = 'triqui';

const client = new MongoClient(url, { useUnifiedTopology: true });

let db;

const connect = async (databName = dbName) => {
    const conn = await client.connect();
    db = conn.db(databName);
    return client;
}

const insertMatch = async function (doc, callback) {
    const collection = db.collection('encuentros');
    const match = await collection.insertOne(doc);
    callback(match);
}

const findMatchs = function (callback) {
    const collection = db.collection('encuentros');
    collection.find({}).toArray(function (err, docs) {
        assert.equal(err, null);
        callback(docs);
    });
}

exports.connect = connect;
exports.insertMatch = insertMatch;
exports.findMatchs = findMatchs;