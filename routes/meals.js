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
router.post("/ingredients", function (req, res) {
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
  User.findOne({ token: token }).then((user) => {
    if (user) {
      // User found => parse necessary ingredients
      mealIngredients = req.body.mealIngredients;

      // Check if ingredients already exist}) in database
      for (let i = 0; i < mealIngredients.length; i++) {
        Ingredients.findOne({
          name: { $regex: new RegExp(mealIngredients[i], "i") },
        }).then((data) => {
          if (data == null) {
            // Ingredient not found => create new ingredient
            const newIngredient = new Ingredients({
              name: mealIngredients[i],
            });
            newIngredient
              .save()
              .then((data) => {
                console.log("new ingredient created :", data);
              })
              .catch((error) => {
                res.json({
                  result: false,
                  error: error.message || "Cannot create new ingredient",
                });
              });
          }
        });
      }

      // Now that all ingredients exist, fetch all ingredients by name to get their ids

      Ingredients.find({ name: { $in: mealIngredients } }).then(
        (foundIngredients) => {
          if (foundIngredients) {
            const newMeal = new Meals({
              mealName: req.body.mealName,
              mealPrepTime: req.body.mealPrepTime,
              mealIngredients: foundIngredients,
              mealPrepSteps: req.body.mealPrepSteps,
              mealServings: req.body.mealServings,
              userId: user._id, // user id for foreign key
            });

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
          }
        }
      );
    } else {
      res.json({ result: false, error: "User not found" });
    }
  });
});

module.exports = router;
