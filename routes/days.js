var express = require("express");
var router = express.Router();

const Days = require("../models/days");
const User = require("../models/users");

const { checkBody } = require("../modules/checkBody");

/* GET days */
// router.get("/", function (req, res) {
//   Days.find()
//     .then((data) => {
//       res.json({ result: true, days: data });
//     })
//     .catch((error) => {
//       res.json({ result: false, error: "Cannot fetch days" });
//     });
// });

/* GET days for user by token */
router.get("/", function (req, res) {
  // Parse header for token
  if (!req.headers.authorization) {
    return res.status(400).json({ error: "Token is required" });
  }
  const token = req.headers.authorization.split(" ")[1];

  // Check user
  User.findOne({ token: token })
    .then((user) => {
      if (user == null) {
        return res.json({ result: false, error: "User not found" });
      }
      console.log("user found", user);
      // User found
      // Check for days with user id, populate meals
      Days.find({ userId: user._id })
        .populate("mealsId")
        .then((data) => {
          if (!data) {
            return res.json({ result: false, error: "No days found for user" });
          }
          console.log("data", data);
          // Days found, we need to send only necessary fields
          const resultDays = [];
          const days = data.map((day) => {
            resultDays.push({
              dayId: day._id,
              dayName: day.dayName,
              dayNumber: day.dayNumber,
              meals: day.mealsId.map((meal) => {
                return { mealName: meal.mealName, mealId: meal._id };
              }),
            });
          });
          console.log("resultDays", resultDays);
          res.json({ result: true, days: resultDays });
        })
        .catch((error) => {
          res.json({ result: false, error: "Cannot find days" });
        });
    })
    .catch((error) => {
      return res.json({ result: false, error: "Database error" });
    });
});

/* POST a full new day for a user by token */
router.post("/", function (req, res) {
  // Parse header for token
  if (!req.headers.authorization) {
    return res.status(400).json({ error: "Token is required" });
  }
  const token = req.headers.authorization.split(" ")[1];

  // Check request body for required fields
  if (!checkBody(req.body, ["dayName", "dayNumber", "mealsId"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  // Find the user
  User.findOne({ token: token })
    .then((user) => {
      if (user == null) {
        return res.json({ result: false, error: "User not found" });
      }
      // User found => create new day
      const newDay = new Days({
        userId: user._id, // user id for foreign key
        dayName: req.body.dayName,
        dayNumber: req.body.dayNumber,
        mealsId: req.body.mealsId,
      });
      newDay
        .save()
        .then((data) => {
          res.json({ result: true, day: data });
        })
        .catch((error) => {
          res.json({ result: false, error: "Cannot create day" });
        });
    })
    .catch((error) => {
      return res.json({ result: false, error: "Database error" });
    });
});

/* PUT an existing meal in a given day at a given position */
router.put("/", function (req, res) {
  // Parse header for token
  if (!req.headers.authorization) {
    return res.status(400).json({ error: "Token is required" });
  }
  const token = req.headers.authorization.split(" ")[1];

  if (!checkBody(req.body, ["dayId", "mealId", "mealPosition"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  // Find the user
  User.findOne({ token: req.body.token })
    .then((data) => {
      if (data == null) {
        return res.json({ result: false, error: "User not found" });
      }
      // User found => find the corresponding day
      Days.findById(req.body.dayId)
        .then((day) => {
          if (!day) {
            return res.json({ result: false, error: "Day not found" });
          }
          // Day found => update the corresponding meal

          // TODO : if meal is already set ... it will be overwritten
          day.mealsId[req.body.mealPosition] = req.body.mealId;
          day
            .save()
            .then((data) => {
              res.json({ result: true, day: data });
            })
            .catch((error) => {
              res.json({
                result: false,
                error: "Cannot update day with new meal",
              });
            });
        })
        .catch((error) => {
          return res.json({ result: false, error: "Database error" });
        });
    })
    .catch((error) => {
      return res.json({ result: false, error: "Database error" });
    });
});

module.exports = router;
