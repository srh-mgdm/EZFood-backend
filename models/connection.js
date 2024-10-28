const mongoose = require("mongoose");
connectionString = process.env.CONNECTION_STRING + "ezfood";
mongoose
  .connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => console.log("connected to ezfood db"))
  .catch((error) => console.log(error));
