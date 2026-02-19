// const mongoose = require('mongoose');
// require('dotenv').config();

// const connectDB= async()=>{
//     try{
//         const connect = await mongoose.connect(process.env.mongoURI);
//         console.log("mongoDB Connected");
//     }catch(err){
//         console.log(err);
//     }
// }

// module.exports = connectDB;
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    console.log("DB URI:", process.env.mongoURI); 

    await mongoose.connect(process.env.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log("MongoDB Connected");
  } catch (err) {
    console.error(" MongoDB connection failed:", err.message);
    process.exit(1); 
  }
};

module.exports = connectDB;
