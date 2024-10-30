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

// Creates a text index on the 'mealName' field to enable efficient text searches.
// This allows MongoDB to quickly search for meals by keywords in their names.
mealSchema.index({ mealName: "text" });

const Meal = mongoose.model("meals", mealSchema);

module.exports = Meal;
