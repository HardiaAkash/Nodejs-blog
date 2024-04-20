const cors = require("cors");
const bodyParser = require("body-parser");
const express = require("express");
const path = require("path")
const app = express();
require('dotenv').config();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "500kb", extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
const connectDB = require("./Utils/db");
// connectDB();
app.use("/api/auth", require("./Route/authRoute"))
const PORT = process.env.PORT || 5000; // Use 3000 if process.env.PORT is not defined

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
});
