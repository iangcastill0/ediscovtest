const mongoose = require('mongoose');
const config = require("../config/app.config");
const { MongoClient, GridFSBucket } = require('mongodb');
let db;
let bucket;

// Remove deprecated options and fix authSource
mongoose
  .connect(`${config.DATABASE.mongoDBUri}${config.DATABASE.dbName}?authSource=Ediscovery`, {
    authMechanism: "SCRAM-SHA-256",  // Keep this if needed
  })
  .then(() => {
    console.log('Database is connected');
  })
  .catch(err => console.log("MongoDB Connection Error: ", err.message));

const connectToDatabase = async () => {
  try {
    // Remove deprecated options and fix authSource
    const client = new MongoClient(config.DATABASE.mongoDBUri, {
      authSource: "Ediscovery",  // Changed from "test" to "Ediscovery"
      authMechanism: "SCRAM-SHA-256"
    });

    await client.connect();
    db = client.db(config.DATABASE.dbName);
    bucket = new GridFSBucket(db);
    console.log('Connected to the GridFSBucket successfully');
  } catch (error) {
    console.error("GridFS Connection Error:", error.message);
  }
};

const getDb = () => db;
const getBucket = () => bucket;
connectToDatabase();

module.exports = { getDb, getBucket };