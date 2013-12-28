function SocketConnection(channel) {
    var socketURL = "ws://" + window.location.host + "/socket/" + channel;
    var ws = new WebSocket(socketURL);

    // these three methods are designed to be overridden/replaced in your impl.
    ws.onopen = function(event) {
        console.log("Sweet, socket connection to " + socketURL + " is now open!");
    };

    ws.onclose = function(event) {
        console.log("Socket connection to " + socketURL + " is now closed.");
    };

    ws.onmessage = function(message) {
        console.log("Message received from socket: ");
        console.log(message);
    };

    return ws;
}

var connections = {};
module.exports = {
    connect: function(channel) {
        if (!connections[channel]) {
            connections[channel] = new SocketConnection(channel);
        }

        return connections[channel];
    },
    disconnect: function(channel) {
        if (connections[channel]) {
            connections[channel].disconnect();
            connections[channel] = null;
        }
    }
}