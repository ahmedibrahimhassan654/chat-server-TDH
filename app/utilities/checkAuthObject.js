exports.checkAuth = function (auth, socket) {
    if (
        !auth ||
        Object.keys(auth).length === 0 ||
        !auth.id ||
        !auth.name ||
        !auth.type
    ) {
        // Emit an error event to the client
        socket.emit("error", { message: "Authentication object is required." });

        // Disconnect the client
        socket.disconnect(true);
        return;
    }
};
