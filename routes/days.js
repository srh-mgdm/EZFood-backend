var express = require("express");
var router = express.Router();

const Days = require("../models/days");
const User = require("../models/users");

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

  // Check token
  //   if (!req.params.token || req.params.token == "") {
  //     return res.status(400).json({ error: "Token is required" });
  //   }

  // Check user
  User.findOne({ token: req.params.token })
    .then((data) => {
      if (data == null) {
        return res.json({ result: false, error: "User not found" });
      }
      console.log("user found", data);
      // User found
      // Check for days with user id
      Days.find({ userId: req.params.token })
        .then((data) => {
          res.json({ result: true, days: data });
        })
        .catch((error) => {
          res.json({ result: false, error: "Cannot fetch days" });
        });
    })
    .catch((error) => {
      return res.json({ result: false, error: "Database error" });
    });
});

/* POST a full new day for a user by token */
router.post("/", function (req, res) {
  if (!checkBody(req.body, ["token", "dayName", "dayNumber", "mealsId"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  // Find the user
  User.findOne({ token: req.body.token })
    .then((data) => {
      if (data == null) {
        return res.json({ result: false, error: "User not found" });
      }
      // User found => create new day
      const newDay = new Days({
        userId: data._id, // user id for foreign key
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

module.exports = router;
