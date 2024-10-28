const mongoose = require('mongoose');

const daySchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    dayName:String,
    dayNumber:Number, // the day's number in page Home (for example from 1 to 14 for 2 weeks)
    mealsId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'meals' }],

  });



const Day = mongoose.model('days', daySchema);

module.exports = Day;
