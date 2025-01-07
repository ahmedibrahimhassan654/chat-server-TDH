const onlineUsersModel = require("../database/models/onlineUsers");
const {
    checkIfJoinedBefore,
    insertNewOnlineUser,
    onlineUsersIntoDatabase,
} = require("../utilities/checkIfJoinedBefore");
const { generateMockUserData } = require("../utilities/generateMockUserData ");
// Initialize connectedUsers as a Map
const connectedUsers = new Map();
exports.offlineUsersIntoDatabase = async (currentUser) => {
    userModel = { ...currentUser, connectedAt: new Date(), isOnline: true };
    try {
        // Add the user to the online users list in the data base
        const onlineUsers = await onlineUsersModel.findOneAndUpdate(
            {
                id: currentUser.id,
            },
            { disconnectedAt: new Date(), isOnline: false }
        );
    } catch (e) {
        throw Error({
            message:
                "Faild to wrie into the database that is the user is offline",
            e,
        });
    }
};

exports.disconnectingController = (io, socket, currentUserData) => {
    socket.on("disconnect", () => {
        console.log(`Socket ${socket.id} has been disconnected`); // Log socket disconnection

        // Check if the user exists in the connectedUsers Map
        if (connectedUsers.has(socket.id)) {
            const disconnectedUser = connectedUsers.get(socket.id);
            console.log(
                `User ${disconnectedUser.name} with socket id ${socket.id} has disconnected`
            );

            // Remove the user from connectedUsers
            connectedUsers.delete(socket.id);

            console.log(
                "Connected Users after disconnection:",
                Array.from(connectedUsers.values())
            );
        } else {
            console.log(`Socket ID ${socket.id} not found in connectedUsers.`);
        }
    });
};


exports.onlineController = (io, socket, currentUserData) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("user:online", async (userData) => {
        try {
            // Extract and validate the auth object
            const auth = userData?.auth;
            if (!auth || !auth.id || !auth.name || !auth.type) {
                return socket.emit("error", {
                    msg: "Invalid auth object provided.",
                });
            }

            // Update currentUserData with the user's actual data
            currentUserData.id = auth.id;
            currentUserData.name = auth.name;
            currentUserData.type = auth.type;

            console.log(`Processing user:online for user:`, currentUserData);

            // Check if the user already exists in the database
            const joinedBefore = await checkIfJoinedBefore(currentUserData);

            if (joinedBefore) {
                console.log(
                    `User ${currentUserData.id} found in the database.`
                );

                // Populate user chat rooms and emit the appropriate event
                const getUserRooms = await joinedBefore.populate({
                    path: "chatRooms",
                    populate: {
                        path: "members",
                        model: "onlineUsers",
                        select: "username",
                    },
                });

                const roomNames = getUserRooms.chatRooms.map(
                    (room) => room.roomName
                );

                roomNames.forEach((room) => {
                    socket.join(room);
                });

                socket.emit("dataBaseRooms", {
                    msg: "Rooms that joined before",
                    rooms: getUserRooms,
                });
            } else {
                console.log(
                    `User not found in the database. Adding as a new user...`
                );

                const insertResult = await insertNewOnlineUser(currentUserData);

                if (insertResult.error) {
                    console.error(
                        "Error inserting user into the database:",
                        insertResult.message
                    );
                    return socket.emit("error", {
                        msg: insertResult.message,
                    });
                }

                socket.emit("dataBaseRooms", {
                    msg: "User has been added to the database.",
                    rooms: [],
                });
            }
        } catch (error) {
            console.error("Error in user:online event:", error.message);
            socket.emit("error", {
                msg: "An error occurred.",
                error: error.message,
            });
        }
    });
};

