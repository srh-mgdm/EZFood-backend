var express = require("express");
var router = express.Router();
const {ObjectId} = require("mongoose").Types

const { checkBody } = require("../modules/checkBody");

const Meals = require("../models/meals");
const Ingredients = require("../models/ingredients");
const User = require("../models/users");

/* GET ingredients */
router.get("/", function (req, res) {
  Ingredients.find()
    .then((data) => {
      res.json({ result: true, ingredients: data });
    })
    .catch((error) => {
      res.json({ result: false, error: "Cannot fetch ingredients" });
    });
});
/* GET ingredients list by id */
router.get("/list", function (req, res) {
  const ingredientIds = req.query.ids ? req.query.ids.split(",") : []; // Récupère les IDs sous forme de tableau

  if (ingredientIds.length === 0) {
    return res.json({ result: false, error: "No ingredient IDs provided" });
  }

  Ingredients.find({ _id: { $in: ingredientIds } })
    .then((data) => {
      res.json({ result: 'WTH', ingredients: data });
    })
    .catch((error) => {
      res.json({ result: false, error: "Cannot fetch ingredients" });
    });
});


/* GET ingredients by name - token NOT required */
router.get("/name/:ingName", function (req, res) {
  // Let's use ranked search patterns
  Ingredients.find(
    { $text: { $search: req.params.ingName } },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .then((results) => {
      res.json({ result: true, ingredients: results });
    })
    .catch((error) => {
      console.error("Error fetching ingredients:", error);
      res.json({ result: false, error: "Cannot fetch ingredients" });
    });
});

/* POST a new ingredient, only possible for a user with a token */
router.post("/", function (req, res) {
  if (!checkBody(req.body, ["name"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  // Parse header for token
  if (!req.headers.authorization) {
    return res.status(400).json({ error: "Token is required" });
  }
  const token = req.headers.authorization.split(" ")[1];

  // Get user
  User.findOne({ token: token })
    .then((data) => {
      if (data == null) {
        return res.json({ result: false, error: "User not found" });
      }
      // User found => create new ingredient

      // Check if ingredient already exists
      Ingredients.findOne({
        name: { $regex: new RegExp(req.body.name, "i") },
      }).then((data) => {
        if (data != null) {
          return res.json({
            result: false,
            error: "Ingredient with same name already exists",
          });
        } else {
          const newIngredient = new Ingredients({
            name: req.body.name,
          });
          newIngredient
            .save()
            .then((data) => {
              res.json({ result: true, ingredient: data });
            })
            .catch((error) => {
              res.json({ result: false, error: "Cannot create ingredient" });
            });
        }
      });
    })
    .catch((error) => {
      res.json({ result: false, error: "Database error" });
    });
});

/* GET meal by id => ingredients list */
router.post("/list", async function (req, res) {

  // const mealIds = req.body.mealIds

  // let mealIdArr = []
  // for (const m of mealIds) {
  //  m && mealIdArr.push(new ObjectId(String(m)))
  // }
  
  // mealIdArr.forEach(mealId => 
  //   Meals.findById(mealId)
  //     .populate("mealIngredients.ingredientId")
  //     .then((data) => {
  //         res.json({ result: true, meal: data.mealName });
  //       })
  // )
  try {
    const mealIds = req.body.mealIds;

    // Vérifiez que mealIds est un tableau
    if (!Array.isArray(mealIds)) {
      return res.status(400).json({ result: false, error: "mealIds must be an array" });
    }

    // Convertir les ID en ObjectId et filtrer les valeurs nulles/undefined
    let mealIdArr = mealIds.filter(Boolean).map(m => new ObjectId(String(m)));

    // Utiliser Promise.all pour attendre toutes les requêtes asynchrones
    const meals = await Promise.all(
      mealIdArr.map(mealId => 
        Meals.findById(mealId)
        .populate("mealIngredients.ingredientId")
      )
    );

    // Vérifiez et retournez les résultats collectés
  
    const resultIngredients = [];

    meals.forEach(meal => {
      if (meal && meal.mealIngredients) {
        meal.mealIngredients.forEach(ingredient => {
          if (ingredient.ingredientId) {
            // Cherchez si l'ingrédient est déjà dans resultIngredients
            let ingIndex = resultIngredients.findIndex(ing => ing.name === ingredient.ingredientId.name);

            if (ingIndex === -1) {
              // Si l'ingrédient n'est pas trouvé, l'ajouter à la liste
              resultIngredients.push({
                name: ingredient.ingredientId.name,
                qt: ingredient.quantity,
                unitType: ingredient.unit
              });
            } else {
              // Si l'ingrédient est trouvé, ajouter la quantité
              resultIngredients[ingIndex].qt += ingredient.quantity;
            }
          }
        });
      }
    });
    console.log("Réponse envoyée :", JSON.stringify(resultIngredients, null, 2));

    res.json({ result: true, shoppingList: resultIngredients });
  } catch (error) {
    console.error("Error fetching meals:", error);
    res.status(500).json({ result: false, error: "Internal server error" });
  }
});

module.exports = router;
