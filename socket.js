const socketIO = require("socket.io");
const {
    onlineController,
    disconnectingController,
} = require("./app/socketControllers/connectionController");
const {
    getProviderRooms,
    joinSingleRoomByRoomName,
    createRoomByName,
} = require("./app/socketControllers/chtRoomController");
const { messageToRoom } = require("./app/socketControllers/messageController");

const { checkAuth } = require("./app/utilities/checkAuthObject");
const {
    generateMockUserData,
} = require("./app/utilities/generateMockUserData ");

module.exports = (httpServer) => {
    const io = socketIO(httpServer, {
        transports: ["websocket", "polling"], // Support WebSocket and polling
        cors: {
            origin: "*", // Allow all origins for testing
            methods: ["GET", "POST"],
        },
    });
    let connectedUsers = new Map(); // Store connected sockets

    io.on("connection", (socket) => {
        const auth = socket.handshake.auth;

        if (!auth || !auth.id || !auth.name || !auth.type) {
            console.error("Invalid auth object provided:", auth);
            socket.disconnect(); // Disconnect if auth is invalid
            return;
        }

        console.log("Handshake auth:", auth);
        console.error("Invalid auth object:", {
            providedAuth: auth,
            expectedFormat: { id: "string", name: "string", type: "string" },
        });
        const currentUserData = {
            id: auth.id || "unknown",
            name: auth.name || "anonymous",
            type: auth.type || "user",
            connectedAt: new Date(),
            isMock: false,
        };

        console.log(`User connected:`, currentUserData);

        // Store the connected user in the map
        connectedUsers.set(socket.id, currentUserData);

        // --- Event controllers ---
        onlineController(io, socket, currentUserData);
        disconnectingController(io, socket, currentUserData);
        createRoomByName(io, socket, currentUserData);
        joinSingleRoomByRoomName(io, socket, currentUserData);
        getProviderRooms(io, socket, currentUserData);
        messageToRoom(io, socket, currentUserData);

        // Handle disconnection
        socket.on("disconnect", () => {
            if (connectedUsers.has(socket.id)) {
                const disconnectedUser = connectedUsers.get(socket.id);
                console.log(
                    `User ${disconnectedUser.name} with socket id ${socket.id} has disconnected`
                );

                connectedUsers.delete(socket.id); // Clean up the connected user map
            }
        });
    });
};
