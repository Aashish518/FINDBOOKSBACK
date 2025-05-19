const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/AuthMid");
const User = require("../Schema/User");

router.get("/profile", authenticateToken, async (req, res) => {
    try {
        // Make sure req.userId is correctly set by the authenticateToken middleware
        const user = await User.findOne({ _id: req.userId });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ user: user });
    } catch (error) {
        console.error("Error fetching profile data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
