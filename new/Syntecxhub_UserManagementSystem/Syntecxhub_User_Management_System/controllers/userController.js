const mongoose = require("mongoose");
const User = require("../models/user");
const generateToken = require("../utils/generateToken");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const normalizeEmail = (email) => String(email).trim().toLowerCase();

const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
});

// @desc    Register a new user (role is always "user")
// @route   POST /api/users
// @access  Public
const createUser = async (req, res) => {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (!EMAIL_REGEX.test(String(email).trim())) {
        return res.status(400).json({ message: "Please provide a valid email" });
    }

    if (String(password).length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({
            message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
        });
    }

    const cleanEmail = normalizeEmail(email);

    if (await User.findOne({ email: cleanEmail })) {
        return res.status(409).json({ message: "User already exists" });
    }

    // Password is hashed by the model's pre-save hook.
    const user = await User.create({
        name: String(name).trim(),
        email: cleanEmail,
        password: String(password)
    });

    res.status(201).json({
        message: "User created successfully",
        user: publicUser(user),
        token: generateToken(user._id)
    });
};

// @desc    Log in and receive a JWT
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizeEmail(email) }).select("+password");

    // Same message for unknown email and wrong password (no user enumeration)
    if (!user || !(await user.comparePassword(String(password)))) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    res.status(200).json({
        message: "Login successful",
        user: publicUser(user),
        token: generateToken(user._id)
    });
};

// @desc    Get the logged-in user's profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
    res.status(200).json({ user: publicUser(req.user) });
};

// @desc    List users (paginated)
// @route   GET /api/users?page=1&limit=10
// @access  Admin
const getUsers = async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

    const [users, total] = await Promise.all([
        User.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        User.countDocuments()
    ]);

    res.status(200).json({
        message: "Users fetched successfully",
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        users
    });
};

// Shared guard: valid ObjectId, and caller is the owner or an admin.
const resolveTargetId = (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        res.status(400).json({ message: "Invalid user id" });
        return null;
    }

    const isSelf = req.user._id.toString() === id;
    if (!isSelf && req.user.role !== "admin") {
        res.status(403).json({ message: "Forbidden: you can only access your own account" });
        return null;
    }

    return id;
};

// @desc    Get a user by id
// @route   GET /api/users/:id
// @access  Private (self or admin)
const getUserById = async (req, res) => {
    const id = resolveTargetId(req, res);
    if (!id) return;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
};

// @desc    Update a user (name, email, password; role is admin-only)
// @route   PUT /api/users/:id
// @access  Private (self or admin)
const updateUser = async (req, res) => {
    const id = resolveTargetId(req, res);
    if (!id) return;

    const user = await User.findById(id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, email, password, role } = req.body || {};

    if (name !== undefined) {
        if (!String(name).trim()) {
            return res.status(400).json({ message: "Name cannot be empty" });
        }
        user.name = String(name).trim();
    }

    if (email !== undefined) {
        if (!EMAIL_REGEX.test(String(email).trim())) {
            return res.status(400).json({ message: "Please provide a valid email" });
        }
        const cleanEmail = normalizeEmail(email);
        const taken = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
        if (taken) return res.status(409).json({ message: "Email is already in use" });
        user.email = cleanEmail;
    }

    if (password !== undefined) {
        if (String(password).length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({
                message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
            });
        }
        user.password = String(password); // hashed by pre-save hook
    }

    if (role !== undefined) {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only an admin can change roles" });
        }
        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ message: "Role must be 'user' or 'admin'" });
        }
        user.role = role;
    }

    await user.save();

    res.status(200).json({ message: "User updated successfully", user });
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private (self or admin)
const deleteUser = async (req, res) => {
    const id = resolveTargetId(req, res);
    if (!id) return;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();

    res.status(200).json({ message: "User deleted successfully" });
};

module.exports = {
    createUser,
    loginUser,
    getProfile,
    getUsers,
    getUserById,
    updateUser,
    deleteUser
};
