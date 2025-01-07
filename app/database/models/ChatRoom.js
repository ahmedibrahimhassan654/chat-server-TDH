const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    messageType: {
        type: String,
        required: true,
    },
    sender: { type: String, required: true },
    reciver: { type: String },
    readStatus: {
        type: Boolean,
        default: false,
    },
    deliveredStatus: {
        type: Boolean,
        default: false,
    },

    undeliveredMembers: [mongoose.Schema.Types.ObjectId],

    unreadMembers: [mongoose.Schema.Types.ObjectId],

    timeSent: Date,

    // If text message was sent
    message: String,
});

const Schema = new mongoose.Schema({
    roomName: {
        type: String,
        unique: true,
        required: true,
    },
    roomType: {
        type: String,
        enum: ["private", "public"],
        required: true,
    },
    providerId: {
        type: String,
        unique: true,
        required: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "onlineUsers" }],
    messageHistory: [MessageSchema],
});

module.exports = mongoose.model("ChatRoom", Schema);
