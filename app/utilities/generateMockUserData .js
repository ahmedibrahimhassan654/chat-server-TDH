exports.generateMockUserData = (socket) => {
    // Extract the nested `auth` object from `socket.handshake.auth`
    const authData = socket.handshake.auth?.auth || {};

    return {
        id: authData.id || `user_${socket.id}`, // Default to socket ID if no user ID is provided
        name: authData.name || `User ${socket.id}`, // Default to a generated name if not provided
        type: authData.type || "user", // Default to "user" if type is not provided
        connectedAt: new Date(), // Automatically set connection time
        isMock: !authData.id, // Flag to indicate whether this is mock data
    };
};
