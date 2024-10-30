var express = require("express");
var router = express.Router();

const Meals = require("../models/meals");
const User = require("../models/users");
const Ingredients = require("../models/ingredients");

const { checkBody } = require("../modules/checkBody");

/* GET meals - technical route for test purpose only */
router.get("/all", function (req, res) {
  Meals.find()
    .then((data) => {
      res.json({ result: true, meals: data });
    })
    .catch((error) => {
      res.json({ result: false, error: "Cannot fetch meals" });
    });
});

/* GET meal by meal name - token NOT required */
router.get("/name/:mealName", function (req, res) {
  // Let's use aggregation framework
  Meals.aggregate([
    {
      $search: {
        index: "default", // search index created in the db
        compound: {
          should: [
            {
              autocomplete: {
                query: req.params.mealName, // text to search
                path: "mealName", // field to search in the db
                fuzzy: {
                  maxEdits: 2, // tolerance for typing errors
                },
                score: { boost: { value: 20 } }, // boost results matching the text
              },
            },
          ],
        },
      },
    },
    {
      $project: {
        mealName: 1,
        score: { $meta: "searchScore" },
      },
    },
    {
      $sort: {
        score: -1, // sort by score in descending order
      },
    },
  ])
    .then((results) => {
      res.json({ result: true, meals: results });
    })
    .catch((error) => {
      console.error("Error fetching meal:", error);
      res.json({ result: false, error: "Cannot fetch meal" });
    });
});

/* GET meals for user by token */
router.get("/", function (req, res) {
  // Parse header for token
  if (!req.headers.authorization) {
    return res.status(400).json({ error: "Token is required" });
  }
  const token = req.headers.authorization.split(" ")[1];

  // Get user
  User.findOne({ token: token })
    .then((data) => {
      if (data) {
        Meals.find({ userId: data._id })
          .then((meals) => {
            res.json({ result: true, meals: meals });
          })
          .catch((error) => {
            res.json({ result: false, error: "Cannot fetch meals" });
          });
      } else {
        res.json({ result: false, error: "User not found" });
      }
    })
    .catch((error) => {
      res.json({
        result: false,
        error: "Database error when looking for user",
      });
    });
});

/* POST a full new meal for a user by token */
router.post("/", function (req, res) {
  // Parse header for token
  if (!req.headers.authorization) {
    return res.status(400).json({ error: "Token is required" });
  }
  const token = req.headers.authorization.split(" ")[1];

  // Check request body for required fields
  if (
    !checkBody(req.body, [
      "mealName",
      "mealPrepTime",
      "mealIngredients",
      "mealPrepSteps",
      "mealServings",
    ])
  ) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  // Get user
  User.findOne({ token: token })
    .then((data) => {
      if (data) {
        const newMeal = new Meals({
          mealName: req.body.mealName,
          mealPrepTime: req.body.mealPrepTime,
          mealIngredients: req.body.mealIngredients,
          mealPrepSteps: req.body.mealPrepSteps,
          mealServings: req.body.mealServings,
          userId: data._id, // user id for foreign key
        });

        console.log("user found, creating new meal :", newMeal);

        newMeal
          .save()
          .then((data) => {
            res.json({ result: true, meal: data });
          })
          .catch((error) => {
            res.json({
              result: false,
              error: error.message || "Cannot create new meal",
            });
          });
      } else {
        res.json({ result: false, error: "User not found" });
      }
    })
    .catch((error) => {
      res.json({ result: false, error: "Database error" });
    });
});

/* POST a new meal, with ingredients, create new ingredients if needed */
router.post("/ingredients", async function (req, res) {
  // Parse header for token
  if (!req.headers.authorization) {
    return res.status(400).json({ error: "Token is required" });
  }
  const token = req.headers.authorization.split(" ")[1];

  // Check request body for required fields
  if (
    !checkBody(req.body, [
      "mealName",
      "mealPrepTime",
      "mealIngredients",
      "mealPrepSteps",
      "mealServings",
    ])
  ) {
    return res.json({ result: false, error: "Missing or empty fields" });
  }

  try {
    const user = await User.findOne({ token: token });
    if (!user) throw new Error("User not found");

    const { mealIngredients } = req.body;
    const resolvedIngredients = [];

    for (const ingr of mealIngredients) {
      let ingredientId = null;

      const ingredientFound = await Ingredients.findOne({
        name: { $regex: new RegExp(ingr.name, "i") },
      });

      if (ingredientFound) {
        ingredientId = ingredientFound._id;
      } else {
        const newIngredient = await new Ingredients({ name: ingr.name });
        await newIngredient.save();
        ingredientId = newIngredient._id;
      }

      resolvedIngredients.push({
        ingredientId: ingredientId,
        quantity: ingr.quantity || null,
        unit: ingr.unit || null,
      });
    }

    // Update resolvedIngredients with data from mealIngredients
    // for (let i = 0; i < resolvedIngredients.length; i++) {
    //   resolvedIngredients[i].quantity = mealIngredients[i].quantity;
    //   resolvedIngredients[i].unit = mealIngredients[i].unit;
    // }

    // Create new meal
    const newMeal = new Meals({
      mealName: req.body.mealName,
      mealPrepTime: req.body.mealPrepTime,
      mealIngredients: resolvedIngredients,
      mealPrepSteps: req.body.mealPrepSteps,
      mealServings: req.body.mealServings,
      userId: user._id, // user id for foreign key
    });

    const meal = await newMeal.save();
    res.json({ result: true, meal: meal });
  } catch (error) {
    res.json({ result: false, error: error.message || "Database error" });
  }
});

module.exports = router;
