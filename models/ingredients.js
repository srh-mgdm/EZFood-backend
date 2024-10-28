const mongoose = require("mongoose");

const servingSchema = mongoose.Schema({
  name: String,
  quantity: Number,
  unit: String,
});

const ingredientSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  name: String,
  servings: {
    type: [servingSchema],
    default: [{ name: "default serving", quantity: 100, unit: "g" }],
  },
});

const Ingredient = mongoose.model("ingredients", ingredientSchema);

module.exports = Ingredient;
