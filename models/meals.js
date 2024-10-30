const mongoose = require("mongoose");

const ingredientSchema = mongoose.Schema({
  ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: "ingredients" },
  quantity: Number,
  unit: String,
});

const prepStepSchema = mongoose.Schema({
  stepNumber: Number,
  stepDescription: String,
});

const mealSchema = mongoose.Schema({
  mealName: String,
  mealPrepTime: Number,
  mealIngredients: [ingredientSchema],
  mealPrepSteps: [prepStepSchema],
  mealServings: Number,
});

mealSchema.index({ mealName: "text" });

const Meal = mongoose.model("meals", mealSchema);

module.exports = Meal;
