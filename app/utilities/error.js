const ErrorResponse = require("./errorResponse");

const mongoose = require("mongoose");
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log to console for dev
    console.log(err);
    if (err instanceof mongoose.Error.ValidationError) {
        const errors = Object.values(err.errors).map((error) => error.message);
        return res.status(400).json({ error: "Validation failed", errors });
    }
    next(err); // Pass on other errors to the default error handler
    // Mongoose bad ObjectId
    if (err.name === "CastError") {
        const invalidIdField = err.path.split(".")[0];
        const modelName = err.model?.modelName || "Unknown"; // Check if err.model exists
        const message = `Invalid ${modelName} ID: ${err.value}. Please enter a valid 24-character hexadecimal string.`;
        error = new ErrorResponse(message, 400);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0]; // Get the field that caused the duplication
        const value = err.keyValue[field]; // Get the duplicated value
        const message = `Duplicate value entered for ${field}: "${value}"`;
        error = new ErrorResponse(message, 400);
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
        const message = Object.values(err.errors).map((val) => val.message);
        error = new ErrorResponse(message, 400);
    }

    // JWT Token errors
    if (err.name === "JsonWebTokenError") {
        const message = "Invalid token. Please log in again.";
        error = new ErrorResponse(message, 401);
    }

    // JWT Token expired
    if (err.name === "TokenExpiredError") {
        const message = "Your token has expired. Please log in again.";
        error = new ErrorResponse(message, 401);
    }

    // Unauthorized error
    if (err.name === "UnauthorizedError") {
        const message = "You are not authorized to access this resource";
        error = new ErrorResponse(message, 401);
    }

    // Forbidden error
    if (err.name === "ForbiddenError") {
        const message = "You don't have permission to perform this action";
        error = new ErrorResponse(message, 403);
    }

    // Handle multer file upload errors
    if (err.code === "LIMIT_FILE_SIZE") {
        const message = "File is too large";
        error = new ErrorResponse(message, 400);
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
        const message = "Too many files or wrong field name";
        error = new ErrorResponse(message, 400);
    }

    // Handle network errors
    if (err.code === "ECONNREFUSED") {
        const message = "Failed to connect to the server";
        error = new ErrorResponse(message, 503);
    }

    // Handle TypeErrors (often due to trying to access properties of undefined)
    if (err instanceof TypeError) {
        const message = "An unexpected error occurred";
        error = new ErrorResponse(message, 500);
    }

    // Handle any unhandled promise rejections
    if (err.name === "UnhandledPromiseRejectionWarning") {
        const message = "An unexpected error occurred";
        error = new ErrorResponse(message, 500);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Server Error",
    });
};

module.exports = errorHandler;
