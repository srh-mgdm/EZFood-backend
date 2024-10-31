const mongoose = require("mongoose");

const daySchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  dayName: String,
  dayNumber: Number, // the day's number in page Home (for example from 1 to 14 for 2 weeks)
  mealsId: [{ type: mongoose.Schema.Types.ObjectId, ref: "meals" }],
});

daySchema.static("findDaysWithMeals", async function findDaysWithMeals(userId) {
  return this.aggregate([
    {
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
        as: "meal",
      },
    },
    {
      $addFields: {
        meal: {
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
        _id: "$_id",
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
