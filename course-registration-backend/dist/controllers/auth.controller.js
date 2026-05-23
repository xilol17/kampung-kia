"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../config/prisma");
const login = async (req, res) => {
    try {
        const { id, password } = req.body;
        if (password !== '123456') {
            res.status(401).json({ error: 'Wrong Password' });
            return;
        }
        // Check user is exist in database or not
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: id.toUpperCase() }
        });
        if (!user) {
            res.status(404).json({ error: 'No Record, Pleace Check ID' });
            return;
        }
        // Sign Token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        // Send token and user info
        res.json({
            message: 'Login Successful!',
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                faculty: user.faculty,
                program: user.program
            }
        });
    }
    catch (error) {
        console.error("Auth error:", error);
        res.status(500).json({ error: 'Server internal error' });
    }
};
exports.login = login;
