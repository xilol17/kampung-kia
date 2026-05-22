import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize } = format;

// Define the custom format for your logs
const customFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

export const logger = createLogger({
  level: 'info', // Set the minimum log level to display
  format: combine(
    colorize({ all: true }), 
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat
  ),
  transports: [
    // Output logs to the terminal console
    new transports.Console(),
    // Bonus for Hackathon: You can uncomment these to save logs to a file!
    // new transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new transports.File({ filename: 'logs/system.log' }),
  ],
});