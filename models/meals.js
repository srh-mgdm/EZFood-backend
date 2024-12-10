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
  mealImage: String,
  isPublic: {type: Boolean, default: true},
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
});

// Creates a text index on the 'mealName' field to enable efficient text searches.
// This allows MongoDB to  search  meals quickly by keywords in their names.
mealSchema.index({ mealName: "text" });

const Meal = mongoose.model("meals", mealSchema);

module.exports = Meal;
