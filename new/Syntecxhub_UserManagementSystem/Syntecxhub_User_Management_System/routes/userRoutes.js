const express = require("express");
const {
    createUser,
    loginUser,
    getProfile,
    getUsers,
    getUserById,
    updateUser,
    deleteUser
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Public
router.post("/", createUser);        // register
router.post("/login", loginUser);    // login

// Authenticated
router.get("/profile", protect, getProfile);

// Admin only
router.get("/", protect, authorize("admin"), getUsers);

// Self or admin (checked in controller)
router.get("/:id", protect, getUserById);
router.put("/:id", protect, updateUser);
router.delete("/:id", protect, deleteUser);

module.exports = router;
