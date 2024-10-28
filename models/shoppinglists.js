const mongoose = require('mongoose');



const shoppingListSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  ingredientName: String,
  quantity: Number,
  unit: String,
  isBought: Boolean
});

const ShoppingList = mongoose.model('shoppinglists', shoppingListSchema);

module.exports = ShoppingList;
