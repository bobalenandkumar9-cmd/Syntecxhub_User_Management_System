const express = require("express");
const userRoutes = require("./routes/userRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "User Management API is running" });
});

app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
