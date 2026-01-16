"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const auth_1 = require("firebase-admin/auth");
const authMiddleware = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).send("Missing auth token");
    }
    const token = header.split("Bearer ")[1];
    try {
        const decodedToken = await (0, auth_1.getAuth)().verifyIdToken(token);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
        };
        next();
    }
    catch (error) {
        return res.status(401).send("Invalid auth token");
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.js.map