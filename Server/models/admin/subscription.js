const mongoose = require("mongoose");
const { Schema } = mongoose;

const SubscriptionPlan = mongoose.model(
  "SubscriptionPlan",
  new mongoose.Schema({
    planId: String,
    planVariationId: String,
    title: String,
    description: String,
    price: Number,
    workspaceCount: Number,
    storageSpace: Number,
    items: []
  }, { timestamps: true })
);

module.exports = SubscriptionPlan;
