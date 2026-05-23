"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = require("winston");
const { combine, timestamp, printf, colorize } = winston_1.format;
// Define the custom format for your logs
const customFormat = printf(({ level, message, timestamp }) => {
    return `[${timestamp}] ${level}: ${message}`;
});
exports.logger = (0, winston_1.createLogger)({
    level: 'info', // Set the minimum log level to display
    format: combine(colorize({ all: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), customFormat),
    transports: [
        // Output logs to the terminal console
        new winston_1.transports.Console(),
        // Bonus for Hackathon: You can uncomment these to save logs to a file!
        // new transports.File({ filename: 'logs/error.log', level: 'error' }),
        // new transports.File({ filename: 'logs/system.log' }),
    ],
});
