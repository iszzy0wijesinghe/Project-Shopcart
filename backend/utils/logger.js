// import pino from "pino";
// import fs from "fs";

// // Ensure logs directory exists
// const logDir = "./logs";
// if (!fs.existsSync(logDir)) {
//     fs.mkdirSync(logDir);
// }

// // Log file streams
// const logFileStream = `${logDir}/app.log`;

// // Configuring log levels based on environment
// const level = process.env.NODE_ENV === "production" ? "info" : "debug";

// const logger = pino({
//     level,
//     timestamp: pino.stdTimeFunctions.isoTime,
//     transport: {
//         targets: [
//             {
//                 target: "pino-pretty",
//                 options: {
//                     colorize: true,
//                     translateTime: `SYS:yyyy-mm-dd | HH:MM:ss`,
//                     ignore: "pid,hostname",
//                     singleLine: false, // Multi-line output for readability
//                 },
//             },
//             {
//                 target: "pino/file",
//                 options: {
//                     destination: `${logDir}/app.log`, // File logging
//                     mkdir: true,
//                 },
//             },
//         ],
//     },
//     serializers: {
//         req: (req) => ({
//             method: req.method,
//             url: req.url,
//             headers: req.headers,
//         }),
//         err: pino.stdSerializers.err, // Standard error serializer
//     },
// });

// // Create a child logger for specific modules
// const apiLogger = logger.child({ module: "API" });
// const dbLogger = logger.child({ module: "Database" });

// // Express middleware for request logging
// const httpLogger = (req, res, next) => {
//     logger.info({ req }, "Incoming request");
//     next();
// };

// // Export logger and utilities
// export { logger, apiLogger, dbLogger, httpLogger };
// export default logger;


import pino from "pino";
import fs from "fs";
import path from "path";
import pinoPretty from "pino-pretty";
import pinoMultiStream from "pino-multi-stream";
import { createStream } from "rotating-file-stream"; // Log Rotation

// Ensure logs directory exists
const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Rotating file stream: rotates logs daily
const rotatingStream = createStream("app.log", {
    interval: "1d", // Rotate daily
    path: logDir,
    maxSize: "10M", // Limit file size before rotating
    maxFiles: 30, // Keep logs for 30 days
    compress: "gzip", // Compress rotated logs
});

// Pretty print stream for console
const prettyConsoleStream = pinoPretty({
    colorize: true, // Colors in console
    translateTime: "yyyy-mm-dd | HH:MM:ss", // Human-readable timestamps
    ignore: "pid,hostname", // Remove unnecessary fields
    singleLine: false, // Keep multi-line for better readability
});

// Pretty print stream for log files
const prettyFileStream = pinoPretty({
    colorize: false, // No colors in log files
    translateTime: "yyyy-mm-dd | HH:MM:ss", // Readable timestamps
    ignore: "pid,hostname", // Remove extra fields
    singleLine: false,
});

// Log level based on environment
const level = process.env.NODE_ENV === "production" ? "info" : "debug";

// Define multiple log streams (console + file)
const streams = [
    { stream: prettyConsoleStream }, // Console logs (pretty)
    { stream: prettyFileStream.pipe(rotatingStream) }, // Rotating file logs (formatted)
];

// Create the main logger
const logger = pino(
    {
        level,
        timestamp: pino.stdTimeFunctions.isoTime,
        serializers: {
            req: (req) => ({
                method: req.method,
                url: req.url,
                headers: req.headers,
            }),
            err: pino.stdSerializers.err, // Standard error serializer
        },
    },
    pinoMultiStream.multistream(streams)
);

// Create child loggers for different modules
const apiLogger = logger.child({ module: "API" });
const dbLogger = logger.child({ module: "Database" });

// Express middleware for logging HTTP requests
const httpLogger = (req, res, next) => {
    logger.info({ req }, "Incoming request");
    next();
};

// Export the loggers
export { logger, apiLogger, dbLogger, httpLogger };
export default logger;


// import pino from "pino";
// import fs from "fs";
// import path from "path";
// import { createStream } from "rotating-file-stream"; // Log Rotation

// // Ensure logs directory exists
// const logDir = path.join(process.cwd(), "logs");
// if (!fs.existsSync(logDir)) {
//     fs.mkdirSync(logDir, { recursive: true });
// }

// // Rotating file stream: rotates logs daily
// const rotatingStream = createStream("app.log", {
//     interval: "1d", // Rotate daily
//     path: logDir,
//     maxSize: "10M", // Limit file size before rotating
//     maxFiles: 30, // Keep logs for 30 days
//     compress: "gzip", // Compress rotated logs
// });

// // Log Level Configuration
// const level = process.env.NODE_ENV === "production" ? "info" : "debug";

// // Configure Logger (Pretty Logs for Both Console & File)
// const logger = pino({
//     level,
//     timestamp: pino.stdTimeFunctions.isoTime,
//     transport: {
//         targets: [
//             // Console Logging with pino-pretty
//             {
//                 target: "pino-pretty",
//                 options: {
//                     colorize: true,
//                     translateTime: `SYS:yyyy-mm-dd | HH:MM:ss`,
//                     ignore: "pid,hostname",
//                     singleLine: false, // Multi-line output for readability
//                 },
//             },
//             // File Logging (Readable format)
//             {
//                 target: "pino-pretty",
//                 options: {
//                     destination: path.join(logDir, "app.log"), // Log to rotating file
//                     colorize: false,
//                     translateTime: `SYS:yyyy-mm-dd | HH:MM:ss`,
//                     ignore: "hostname",
//                     mkdir: true,
//                 },
//             },
//         ],
//     },
// });

// // Create a child logger for specific modules
// const apiLogger = logger.child({ module: "API" });
// const dbLogger = logger.child({ module: "Database" });

// // Express middleware for request logging
// const httpLogger = (req, res, next) => {
//     logger.info({ req }, "Incoming request");
//     next();
// };

// // Export logger and utilities
// export { logger, apiLogger, dbLogger, httpLogger };
// export default logger;