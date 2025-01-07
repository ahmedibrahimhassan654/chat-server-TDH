const connectDB = require("./app/database/connection");

const dotenv = require("dotenv");
const express = require("express");
const morgan = require("morgan");
const http = require("http");
const errorHandler = require("./app/utilities/error");

dotenv.config({ path: "./.env" });

const app = express();
// // Connect to the database
connectDB();
// Middleware
app.use(morgan("dev"));

// Health check route
app.get("/health", (req, res) => {
    res.status(200).send({ status: "Server is running!" });
});

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.IO
require("./socket")(httpServer);

// Error handling middleware
app.use(errorHandler);
// Start the server
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
// Handle server shutdown
process.on("SIGINT", () => {
    console.log("Server shutting down... Disconnecting all users...");
    connectedUsers.forEach((user, socketId) => {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
            socket.disconnect(true); // Forcefully disconnect socket
        }
    });

    // Clear the connected users map
    connectedUsers.clear();
    console.log("All users disconnected.");
    process.exit(); // Exit the process
});
