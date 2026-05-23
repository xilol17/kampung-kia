"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));
const logger_1 = require("./utils/logger");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api', routes_1.default);
// 全局 404 拦截
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});
app.listen(PORT, () => {
    logger_1.logger.info(`===========================================`);
    logger_1.logger.info(`Ai Course Registration Backend is LIVE!`);
    logger_1.logger.info(`API is listening on port ${PORT}`);
    logger_1.logger.info(`===========================================`);
});
