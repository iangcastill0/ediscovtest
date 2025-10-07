const mongoose = require('mongoose');
const config = require("../config/app.config");
const { MongoClient, GridFSBucket } = require('mongodb');
let db;
let bucket;

mongoose
  .connect(config.DATABASE.mongoDBUri, {
  // modern driver ignores useNewUrlParser/useUnifiedTopology anyway
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    authSource: "admin",  // Ensures authentication is done on the correct DB
    authMechanism: "SCRAM-SHA-256",  // Specify authentication mechanism explicitly
  })
  .then(() => {
    console.log('Database is connected');
  })
  .catch(err => console.log("MongoDB Connection Error: ", err.message));

  const connectToDatabase = async () => {
    try {
      const client = new MongoClient(config.DATABASE.mongoDBUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        authSource: "admin",  // Ensures authentication is done on the correct DB
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