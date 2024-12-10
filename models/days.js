const mongoose = require("mongoose");

const daySchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  dayName: String,
  dayNumber: Number, // the day's number in page Home (for example from 1 to 14 for 2 weeks)
  mealsId: [{ type: mongoose.Schema.Types.ObjectId, ref: "meals" }],
});

// A static method is called directly on the model to work with all the data, without accessing a specific document.
// this code define a static method with the name "findDaysWithMeals" for the model day which uses the aggregation in MonfoDB
// The findDaysWithMeals function gets days and their meals from the database.
daySchema.static("findDaysWithMeals", async function findDaysWithMeals(userId) {
  return this.aggregate([
    { // $match: Filters the documents to include only those with the specified userId.
      $match: {
        userId: userId,
      },
    },
    {
      $unwind: {
        path: "$mealsId",
        includeArrayIndex: "mealsIdIndex",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "meals",
        localField: "mealsId",
        foreignField: "_id",
        as: "meal", // is array
      },
    },
    {
      $addFields: {
        meal: { // is array
          $cond: {
            if: {
              $gt: [
                {
                  $size: "$meal",
                },
                0,
              ],
            },
            then: {
              $first: "$meal",
            },
            else: {
              _id: null,
              mealName: null,
              mealImage: null,
            },
          },
        },
      },
    },
    {
      $sort: {
        mealsIdIndex: 1,
      },
    },
    {
      $group: {
        _id: "$_id", // a group is created for each day based on its _id.

        userId: {
          $first: "$userId",
        },
        dayName: {
          $first: "$dayName",
        },
        dayNumber: {
          $first: "$dayNumber",
        },
        meals: {
          $push: {
            mealId: "$meal._id",
            mealName: "$meal.mealName",
            mealImage: "$meal.mealImage",
          },
        },
      },
    },
    {
      $sort: {
        dayNumber: 1,
      },
    },
  ]);
});

const Day = mongoose.model("days", daySchema);

module.exports = Day;
