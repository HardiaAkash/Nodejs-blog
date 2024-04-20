const mongoose = require("mongoose")
// console.log(process.env.mongoDBURL);
const uri = process.env.mongoDBURL;

const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Connection to MongoDB failed:", error);
  }
};

connectDB()

