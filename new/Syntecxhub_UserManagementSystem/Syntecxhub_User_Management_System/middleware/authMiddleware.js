const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Requires a valid "Authorization: Bearer <token>" header.
const protect = async (req, res, next) => {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Not authorized, token missing" });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: "Not authorized, user no longer exists" });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Not authorized, token invalid or expired" });
    }
};

// Restricts a route to the given roles, e.g. authorize("admin").
const authorize = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }
    next();
};

module.exports = { protect, authorize };
