var express = require("express");
var router = express.Router();

const Meals = require("../models/meals");
const User = require("../models/users");

const { checkBody } = require("../modules/checkBody");

/* GET meals */
router.get("/", function (req, res) {
  Meals.find()
    .then((data) => {
      res.json({ result: true, meals: data });
    })
    .catch((error) => {
      res.json({ result: false, error: "Cannot fetch meals" });
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
            res.json({ result: false, error: "Cannot create meal" });
          });
      } else {
        res.json({ result: false, error: "User not found" });
      }
    })
    .catch((error) => {
      res.json({ result: false, error: "Database error" });
    });
});

module.exports = router;
