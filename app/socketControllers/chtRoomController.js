const chatRoomModel = require("../database/models/ChatRoom");
const onlineUsers = require("../database/models/onlineUsers");
const app = require("../app");
// Access the 'rooms' variable using app.get
const rooms = app.get("rooms");

exports.createRoomByName = (io, socket, currentUserData) => {
    socket.on("user:createRoom", async (data) => {
        // Validate providerId existence
        if (!data.roomName) {
            socket.emit("roomCreated", {
                msg: "Room Name is required for creating a room.",
            });
            return;
        }

        // Trim spaces from roomName
        const trimmedRoomName = data.roomName.trim();

        // Validate roomName for special characters
        const specialCharactersRegex = /[!@#$%^&*(),.?":{}|<>]/;
        if (specialCharactersRegex.test(trimmedRoomName)) {
            socket.emit("roomCreated", {
                msg: "Invalid roomName. Special characters are not allowed.",
            });
            return;
        }

        // Validate roomType
        const validRoomTypes = ["private", "public"];
        const isValidRoomType = validRoomTypes.includes(data.roomType);

        if (!isValidRoomType) {
            socket.emit("roomCreated", {
                msg: "Invalid roomType. It should be 'private' or 'public'.",
            });
            return;
        }
        // Validate providerId existence
        if (!data.providerId) {
            socket.emit("roomCreated", {
                msg: "Provider ID is required for creating a room.",
            });
            return;
        }

        const newRoom = {
            roomName: data.roomName,
            roomType: data.roomType,
            providerId: data.providerId,
        };

        // Check if room created before
        const isRoomExist = await chatRoomModel.findOne(newRoom);

        if (isRoomExist) {
            socket.emit("roomCreated", {
                msg: "Room is already exist",
                room: isRoomExist,
            });
        } else {
            // Assuming chatRoomModel.save() returns some data
            try {
                const savedRoom = new chatRoomModel(newRoom);
                await savedRoom.save();
                socket.emit("roomCreated", {
                    msg: "Room has been created successfully",
                    room: savedRoom,
                });
            } catch (e) {
                socket.emit("roomCreated", {
                    msg: "Error occurred",
                    error: e,
                });
                console.log("fire?");
                console.log(e);
            }
        }
    });
};
exports.joinSingleRoomByRoomName = (io, socket, currentUserData) => {
    socket.on("user:joinSingleRoom", async (data) => {
        // Check if data.roomId is provided
        if (!data.roomId) {
            // Emit an error event to the socket that triggered the event
            socket.emit("error", { msg: "Room ID is required for joining." });
            // Emit an error message to the socket that triggered the event
            socket.emit("roomJoined", {
                msg: "Room ID is required for joining.",
            });
            return;
        }

        // Check if room created before
        const roomTobeJoiend = {
            id: data.roomId,
        };

        const currentUserModel = await onlineUsers.findOne({
            id: currentUserData.id,
        });

        const isRoomExist = await chatRoomModel.findById(data.roomId).populate('members');;

        if (isRoomExist) {
            // Check if the user's ID is not already in the room's members array
            if (
                !isRoomExist.members.includes(currentUserModel._id) &&
                !currentUserModel.chatRooms.includes(isRoomExist._id)
            ) {
                // Update user members array of the room
                currentUserModel.chatRooms.push(isRoomExist._id);
                await currentUserModel.save();
                isRoomExist.members.push(currentUserModel._id);
                await isRoomExist.save();
                roomName = isRoomExist.roomName.toString();

                socket.join(roomName);
                socket.emit("roomJoined", {
                    msg: `First time to join this room ${roomName}`,
                    room: isRoomExist,
                });
            } else {
                roomName = isRoomExist.roomName.toString();
                socket.join(roomName);
                socket.emit("roomJoined", {
                    msg: `Welcome back to the room ${roomName}`,
                    room: isRoomExist,
                });
            }
        } else {
            socket.emit("roomJoined", { msg: "Room is not exist" });
        }
    });
};

exports.getProviderRooms = (io, socket, currentUserData) => {
    socket.on("provider:rooms", async (data) => {
        // Check if data.providerId is provided
        if (!data.providerId) {
            // Emit an error event to the socket that triggered the event
            socket.emit("error", { msg: "providerId is required." });
            // Emit an error message to the socket that triggered the event
            socket.emit("provider:rooms", {
                msg: "providerId is required.",
            });
            return;
        }

        try {
            // Retrieve the available rooms from the database where providerId matches
            const usersRooms = await chatRoomModel
                .find({ providerId: data.providerId })
                .populate("members");

            // Emit the rooms to the client
            socket.emit("provider:rooms", { rooms: usersRooms });
        } catch (error) {
            console.error(error);
            // Emit an error message to the client
            socket.emit("error", {
                message: error.message,
            });
        }
    });
};

