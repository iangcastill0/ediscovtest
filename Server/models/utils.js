const mongoose = require('mongoose');

const modelRegistry = {};

const MESG_BACKUP_SCHEMA = {
    "type": String,
    "user": String,
    "text": String,
    "ts": String,
    "replies":{
        type: Array,
        "default": []
    }
}

function createDynamicModel(name, schemaDefinition) {
  if (!modelRegistry[name]) {
    const Schema = mongoose.Schema;
    const dynamicSchema = new Schema(schemaDefinition);
    modelRegistry[name] = mongoose.model(name, dynamicSchema);
  }
  return modelRegistry[name];
}

function getModel(name) {
  return modelRegistry[name] || mongoose.models[name] || null;
}

module.exports = {
  createDynamicModel,
  getModel
};