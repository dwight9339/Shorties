require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const helmet = require("helmet");
const yup = require("yup");
const monk = require("monk");
const { nanoid } = require("nanoid");
const PORT = process.env.PORT || 5000;

const app = express();

const db = monk(process.env.MONGO_URI);


app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(helmet());
app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());
app.use((error, req, res, next) => {
    if (error.status) {
        res.status(error.status);
    }

    res.json({
        message: error.message,
        stack: process.env.NODE_ENV == 'production' ? "" : error.stack
    })
})

// Setup auth
require("./middleware/sessionAuth")(app);

// Bring in routes
require("./routes/urlRoutes")(app, db);
require("./routes/navRoutes")(app, db);

app.listen(PORT, () => {
    console.log("Listening at port " + PORT);
});