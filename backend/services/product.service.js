const Product = require("../models/Product");
const mongoose = require("mongoose");

class ProductService {
  async getProducts() {
    const products = await Product.find().sort({ createdAt: -1 });
    return products;
  }

  async createProduct(name, unit, unitPrice, quantity = 0) {
    if (!name || !unit || unitPrice == null) {
      throw new Error("Missing product data");
    }

    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty < 0) {
      throw new Error("Quantity must be a non-negative number");
    }

    const product = await Product.create({
      name,
      unit,
      unitPrice,
      quantity: qty
    });

    return product;
  }

  async updateProduct(id, name, unit, unitPrice, quantity) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid product id");
    }

    const updateData = { name, unit, unitPrice };
    if (quantity !== undefined && quantity !== null) {
      const qty = Number(quantity);
      if (Number.isNaN(qty) || qty < 0) {
        throw new Error("Quantity must be a non-negative number");
      }
      updateData.quantity = qty;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  }

  async deleteProduct(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid product id");
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      throw new Error("Product not found");
    }

    return { message: "Product deleted successfully" };
  }
}

module.exports = new ProductService();
