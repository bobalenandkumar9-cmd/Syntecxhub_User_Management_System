const notFound = (req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    // Malformed JSON body
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Invalid JSON in request body" });
    }

    // Mongoose schema validation errors
    if (err.name === "ValidationError") {
        const errors = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ message: errors.join(", "), errors });
    }

    // Duplicate key (unique email)
    if (err.code === 11000) {
        return res.status(409).json({ message: "User already exists" });
    }

    console.error(err);

    const body = { message: "Server error" };
    if (process.env.NODE_ENV !== "production") body.error = err.message;
    res.status(err.status || 500).json(body);
};

module.exports = { notFound, errorHandler };
