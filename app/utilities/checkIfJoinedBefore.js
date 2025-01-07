const onlineUsersModel = require("../database/models/onlineUsers");

exports.checkIfJoinedBefore = async (currentUser) => {
    try {
        const joinedBefore = await onlineUsersModel.findOne({
            id: currentUser.id,
        });

        if (joinedBefore) {
            return joinedBefore;
        } else {
            return false;
        }
    } catch (e) {
        console.log(e);
        return e;
    }
};
exports.insertNewOnlineUser = async (userdata) => {
    // Define valid enum values for the `type` field
    const validTypes = ["admin", "user", "provider"];

    // Validate the `type` field before saving
    const userType = userdata.type;
    if (!validTypes.includes(userType)) {
        console.log(
            `Invalid user type: "${userType}". Allowed types are: ${validTypes.join(
                ", "
            )}`
        );
        return {
            error: true,
            message: `Invalid user type: "${userType}". Allowed types are: ${validTypes.join(
                ", "
            )}`,
        };
    }

    // Add required fields like `type`, `connectedAt`, and `isOnline`
    const userModel = {
        ...userdata,
        type: userType || "user", // Default to "user" if not provided
        connectedAt: new Date(),
        isOnline: true,
    };

    try {
        // Add the user to the online users list in the database
        const newUser = new onlineUsersModel(userModel);
        await newUser.save();
        console.log("New user added to the database:", newUser);
        return newUser;
    } catch (e) {
        console.log("Error inserting new user:", e.message);
        return { error: true, message: e.message };
    }
};

exports.onlineUsersIntoDatabase = async (currentUser) => {
    userModel = { ...currentUser, connectedAt: new Date(), isOnline: true };

    try {
        // Add the user to the online users list in the data base
        const onlineUsers = await onlineUsersModel.findOneAndUpdate(
            {
                id: currentUser.id,
            },
            { connectedAt: new Date(), isOnline: true }
        );

        return onlineUsers;
    } catch (e) {
        throw Error({
            message:
                "Faild to write into the database that is the user is online",
            e,
        });
    }
};
