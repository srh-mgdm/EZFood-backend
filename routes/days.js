var express = require("express");
var router = express.Router();

const Days = require("../models/days");
const User = require("../models/users");
const Meals = require("../models/meals");

const { checkBody } = require("../modules/checkBody");

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
      // User found
      // Check for days with user id, populate meals
      Days.findDaysWithMeals(user._id)
        .then((data) => {
          if (data.length === 0) {
            return res.json({ result: false, error: "No days found for user" });
          }

          res.json({
            result: true,
            days: data,
          });
        })
        .catch((error) => {
          res.json({ result: false, error: "Cannot find days: " + error });
        });
    })
    .catch((error) => {
      return res.json({ result: false, error: "Database error: " + error });
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
/* if mealId is not set, corresponding position will be set to an empty meal object */
router.put("/meal/", function (req, res) {
  // Parse header for token
  if (!req.headers.authorization) {
    return res.status(400).json({ error: "Token is required" });
  }
  const token = req.headers.authorization.split(" ")[1];
  console.log("req.body : ", req.body);

  // TODO - check for mealPosition, but it is the number
  if (!checkBody(req.body, ["dayId"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  // Find the user
  User.findOne({ token: token })
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

          // if meal is already set ... it will be overwritten
          // if mealId is not set, corresponding position will be set to empty
          console.log("req.body.mealId : ", req.body.mealId);
          day.mealsId[req.body.mealPosition] = req.body.mealId
            ? req.body.mealId
            : null;

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
          return res.json({
            result: false,
            error: "Database error : " + error,
          });
        });
    })
    .catch((error) => {
      return res.json({ result: false, error: "Database error : " + error });
    });
});

/* DELETE an existing meal in a given day at a given position */
router.delete("/", function (req, res) {
  // Parse header for token
  if (!req.headers.authorization) {
    return res.status(400).json({ error: "Token is required" });
  }
  const token = req.headers.authorization.split(" ")[1];

  if (!checkBody(req.body, ["dayId", "mealPosition"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  // Find the user
  User.findOne({ token: token })
    .then((user) => {
      if (user == null) {
        return res.json({ result: false, error: "User not found" });
      }
      // User found => find the corresponding day
      Days.findById(req.body.dayId)
        .then((day) => {
          if (!day) {
            return res.json({ result: false, error: "Day not found" });
          }
          // Day found => delete the corresponding meal
          day.mealsId.splice(req.body.mealPosition, 1);
          day
            .save()
            .then((data) => {
              res.json({ result: true, day: data });
            })
            .catch((error) => {
              res.json({
                result: false,
                error: "Cannot remove meal from day",
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

/* POST any number of days filling (randomly) with possible meals, for a user by token */
router.post("/generate", function (req, res) {
  // Parse header for token
  if (!req.headers.authorization) {
    return res.status(400).json({ error: "Token is required" });
  }
  const token = req.headers.authorization.split(" ")[1];

  if (!checkBody(req.body, ["dayNumber"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  // Find the user
  User.findOne({ token: token })
    .then((user) => {
      if (user == null) {
        return res.json({ result: false, error: "User not found" });
      }

      // User is found => get meals from database
      Meals.find()
        .then((meals) => {
          if (meals == null) {
            return res.json({ result: false, error: "Meals not found" });
          }

          // We have meals so we can create new days
          const newDays = [];
          for (let i = 0; i < req.body.dayNumber; i++) {
            // Randomize meals from database
            const randomMeals = [];
            for (let j = 0; j < 2; j++) {
              //   console.log(Math.floor(Math.random() * meals.length));
              randomMeals.push(meals[Math.floor(Math.random() * meals.length)]);
            }
            newDays.push(
              new Days({
                userId: user._id,
                dayName: "Jour " + (i + 1),
                dayNumber: i + 1,
                mealsId: randomMeals,
              })
            );
          }

          // Insert newDays
          Days.insertMany(newDays)
            .then((data) => {
              res.json({ result: true, days: data });
            })
            .catch((error) => {
              return res.json({
                result: false,
                error: "Database error when inserting days",
              });
            });
        })
        .catch((error) => {
          return res.json({
            result: false,
            error: "Database error when looking for meals",
          });
        });
    })
    .catch((error) => {
      return res.json({
        result: false,
        error: "Database error when looking for user",
      });
    });
});

// PUT route to fill existing days with unique meals in empty slots for a user by token
router.put("/fillExistingDays", function (req, res) {
  // Parse header for token
  if (!req.headers.authorization) {
    return res.status(400).json({ error: "Token is required" });
  }
  const token = req.headers.authorization.split(" ")[1];

  // Find the user
  User.findOne({ token: token })
    .then((user) => {
      if (user == null) {
        return res.json({ result: false, error: "User not found" });
      }

      // User is found => retrieve user's existing days
      Days.find({ userId: user._id })
        .then((days) => {
          if (!days || days.length === 0) {
            return res.json({ result: false, error: "No existing days found" });
          }

          // Retrieve all meals from the database
          Meals.find()
            .then((meals) => {
              if (!meals || meals.length === 0) {
                return res.json({ result: false, error: "No meals found" });
              }

              // Array of meal IDs for easy reference
              const mealIds = meals.map((meal) => meal._id.toString());

              // Update each day with unique meals only in empty slots
              const updatedDays = days.map((day) => {
                const selectedMeals = new Set(
                  day.mealsId
                    .filter((meal) => meal !== null)
                    .map((meal) => meal.toString())
                );
                let updated = false;

                day.mealsId = day.mealsId.map((mealId) => {
                  if (mealId !== null) return mealId; // Keep non-null meals as they are

                  // Find a unique meal not yet in this day
                  let newMeal;
                  do {
                    newMeal =
                      mealIds[Math.floor(Math.random() * mealIds.length)];
                  } while (selectedMeals.has(newMeal));

                  selectedMeals.add(newMeal); // Add to the set to avoid duplicates
                  updated = true;
                  return newMeal;
                });

                return updated ? day.save() : Promise.resolve(day); // Save only if updated
              });

              // Wait for all updates to complete
              Promise.all(updatedDays)
                .then((results) => {
                  res.json({ result: true, updatedDays: results });
                })
                .catch((error) => {
                  res.status(500).json({
                    result: false,
                    error: "Error updating existing days with meals",
                  });
                });
            })
            .catch((error) => {
              res.status(500).json({
                result: false,
                error: "Database error retrieving meals",
              });
            });
        })
        .catch((error) => {
          res.status(500).json({
            result: false,
            error: "Database error retrieving user's days",
          });
        });
    })
    .catch((error) => {
      res.status(500).json({
        result: false,
        error: "Database error retrieving user",
      });
    });
});

module.exports = router;
