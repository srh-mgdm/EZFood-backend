const mongoose = require('mongoose');
connectionString = process.env.CONNECTION_STRING
mongoose.connect(connectionString,{connectTimeoutMS:2000})
        .then(()=>console.log('connected to DB'))
        .catch(error=>console.log(error))
