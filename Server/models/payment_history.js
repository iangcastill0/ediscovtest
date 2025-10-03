const mongoose = require("mongoose");

const PaymentHistory = mongoose.model(
  "PaymentHistory",
  new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    planID: String,
    price: Number,
    isSuccessed: Boolean
  }, { timestamps: true })
);

module.exports = PaymentHistory;
