// Creates (or promotes) an admin account.
// Usage: set ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD in .env, then run `npm run seed:admin`
const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/user");

const run = async () => {
    const { ADMIN_NAME = "Admin", ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env first.");
        process.exit(1);
    }

    await connectDB();

    const email = ADMIN_EMAIL.trim().toLowerCase();
    let user = await User.findOne({ email });

    if (user) {
        user.role = "admin";
        await user.save();
        console.log(`Existing user ${email} promoted to admin.`);
    } else {
        await User.create({ name: ADMIN_NAME, email, password: ADMIN_PASSWORD, role: "admin" });
        console.log(`Admin ${email} created.`);
    }

    await mongoose.disconnect();
};

run().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
