const axios = require("axios");
const chatRoomModel = require("../database/models/ChatRoom");

exports.messageToRoom = (io, socket, currentUserData) => {
    socket.on("client:sendMessage", async (data) => {
        try {
            // Validate providerId existence
            if (!data.roomId) {
                socket.emit("roomCreated", {
                    msg: "Room Id is required for creating a room.",
                });
                return;
            }
            // Validate providerId existence
            if (!data.messageType) {
                socket.emit("roomCreated", {
                    msg: "Message Type  is required for creating a room.",
                });
                return;
            }
            // Validate providerId existence
            if (!data.messageContent) {
                socket.emit("roomCreated", {
                    msg: "Message Type  is required for creating a room.",
                });
                return;
            }
            const { roomId, messageType, messageContent } = data;
            // Validate input values
            if (
                roomId === undefined ||
                messageType === undefined ||
                messageContent === undefined
            ) {
                console.log("Invalid input in the message method");
                // Emit an error message to the client who sent the message
                socket.emit("error", {
                    message:
                        "Invalid message data. Please provide all required fields.",
                });
                return;
            }

            // Find the chat room by roomId
            const chatRoom = await chatRoomModel
                .findById(roomId)
                .populate("members");

            if (!chatRoom) {
                console.error("room not found ysta");
                socket.emit("error", {
                    message:
                        "Invalid message data. Please provide all required fields.",
                });
            }

            const isMember = chatRoom.members.find(
                (member) => member.id === currentUserData.id
            );

            if (!isMember) {
                socket.emit("error", {
                    message: "User is not a member of the room",
                });
                console.log("User is not a member of the room");
                return;
            }

            // Create a new message
            const newMessage = {
                messageType,
                sender: currentUserData.id,
                timeSent: new Date(),
                message: messageContent,
            };

            // Add the message to the chat room's messageHistory
            chatRoom.messageHistory.push(newMessage);
            await chatRoom.save();

            // Check for offline users and send notifications
            const offlineMembers = chatRoom.members.filter(
                (member) => member.isOnline === false
            );

            if (offlineMembers.length > 0) {
                // Prepare notification data
                const notificationData = {
                    recivers: offlineMembers.map((member) => member.id),
                    title_ar: "${currentUserData.name} رساله من ",
                    body_ar: "${message}",
                    title_en: "message from ${currentUserData.name}",
                    body_en: "${message}",
                    title_ku: "${currentUserData.name}  پەیام لە..",
                    body_ku: "${message}",
                };

                try {
                    // Call the notification API using the environment variable
                    const response = await axios.post(
                        process.env.NOTIFICATION_API_URL,
                        notificationData,
                        {
                            headers: {
                                Accept: "application/json",
                                lang: "2",
                                "Content-Type":
                                    "application/x-www-form-urlencoded",
                            },
                        }
                    );
                    console.log(
                        "Notification API response:",
                        response.data.cyan.underline
                    );
                } catch (notificationError) {
                    // Emit an error message to the client
                    socket.emit("error", {
                        msg: "Error calling notification API:",
                        error: notificationError.message,
                        notificationError,
                    });
                    console.error(
                        "Error calling notification API:",
                        notificationError.message
                    );
                    return;
                }
            }
            
            // Emit the new message to all members in the room
            io.to(chatRoom.roomName).emit("server:newMessage", {
                message: newMessage,
            });
        } catch (error) {
            // Emit an error message to the client
            socket.emit("error", {
                msg: "Inval roomId room id or room is not exist",
                error: error.message,
            });
            console.error(error);
        }
    });
};
