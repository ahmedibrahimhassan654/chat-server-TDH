const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            auto: false,
        },
        name: {
            type: String,
            required: true,
        },

        isOnline: {
            type: Boolean,
        },
        type: {
            type: String,
            required: true,
            enum: ["admin", "user", "provider"],
        },
        connectedAt: {
            type: Date,
        },
        disconnectedAt: {
            type: Date,
        },
        // Chat rooms user belongs to
        chatRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom" }],
    },

    {
        timestamps: true,
    }
);

const onlineUsers = mongoose.model("onlineUsers", userSchema);
module.exports = onlineUsers;
