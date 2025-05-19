const jwt = require("jsonwebtoken");

//const JWT_SECRET = "FindbooksDAD";
const JWT_SECRET = process.env.JWT_KEY;

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader && authHeader.split(' ')[1]; // Ensure this matches the cookie name
    console.log("aashish",token)
    if (!token) {
        console.error("No token provided");
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error("Token verification failed:", err);
            return res.status(403).json({ message: "Forbidden: Invalid or expired token" });
        }
        req.userId = user.User.id;
        next();
    });
};

module.exports = authenticateToken;