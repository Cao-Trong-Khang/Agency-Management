const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit: { type: String, required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, default: 0, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
