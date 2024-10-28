const mongoose = require('mongoose');

const ingredientSchema = mongoose.Schema({
    name: String,
    quantity: Number,
    unit:String,
  });
  const prepStepSchema = mongoose.Schema({
    stepNumber: Number,
    stepDescription: String,
  });

const userMealSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  mealId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'meals' }],
  customMealName: String,
  customPrepTime: Number,
  customIngredients:[ingredientSchema],
  customPrepSteps:[prepStepSchema],
  customServings: Number,
});

const UserMeal = mongoose.model('userMeals', userMealSchema);

module.exports = UserMeal;
