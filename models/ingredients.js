const mongoose = require("mongoose");

// const servingSchema = mongoose.Schema({
//   name: String,
//   quantity: Number,
//   unit: String,
// });

const ingredientSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  name: String,
  // servings: {
  //   type: [servingSchema],
  //   default: [{ name: "default serving", quantity: 100, unit: "g" }],
  // },
});

// Creates a text index on the 'name' field to enable efficient text searches.
// This allows MongoDB to  search  ingredients quickly by keywords in their names.
ingredientSchema.index({ name: "text" });

const Ingredient = mongoose.model("ingredients", ingredientSchema);

module.exports = Ingredient;
