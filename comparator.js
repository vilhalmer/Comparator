var http = require('http');
var dgram = require('dgram');
var fs = require('fs');

var server
  , // Data //
    config
  , // Functions //
    requestStatus, writeBits, sendRequest, payloadReader, generatePage
;

// No error checking or validation on the configuration file at all, yet. Please play nice.
config = JSON.parse(fs.readFileSync("comparator.conf")); // Cool.

server = http.createServer(function(request, response) {
    if (request.url === "/") {
        console.log("Serving status page to " + response.connection.remoteAddress);
        response.writeHead(200, {"Content-Type": "text/html"});
        requestStatus(function(status) {
            if (status) {
                generatePage(status, "status.html", function(data) {
                    response.write(data);
                    response.end();
                });
            }
            else {
                fs.readFile("offline.html", 'utf8', function(err, data) {
                    response.write(data);
                    response.end();
                });
            }
        });
    }
    else { // Handle a normal file. (Poorly, but handle it nonetheless.)
        if (fs.existsSync(process.cwd() + request.url) && fs.statSync(process.cwd() + request.url).isFile()) {
            console.log("Serving request (" + request.url + ") to " + request.connection.remoteAddress);
            response.writeHead(200);
            fs.readFile(process.cwd() + request.url, 'utf8', function(err, data) {
                response.write(data);
                response.end();
            });
        }
        else {
            console.log("Invalid request (" + request.url + ") from " + request.connection.remoteAddress);
            response.writeHead(404);
            response.end();
        }
    }
});

// Actually run the server:

server.listen(config["port"], config["host"], null, function() {
    try {
        console.log("Dropping root privileges...");
        process.setgid(config["group"]);
        process.setuid(config["user"]);
        console.log("Success! Server running on " + config["host"] + ":" + config["port"] + " with uid " + process.getuid() + ".");
    }
    catch (err) {
        console.log("Failed. Cowardly refusing to run as root.");
        process.exit(1);
    }
});

///////////////
// Functions //
///////////////

requestStatus = function(callback) {
    var handshake = new Buffer([ 0xFE, 0xFD, 0x09, 0x20, 0x20, 0x20, 0x20 ]);
    var request = new Buffer([ 0xFE, 0xFD, 0x00, 0x20, 0x20, 0x20, 0x20, 0x00, 0x00, 0x00, 0x00, 0x20, 0x20, 0x20, 0x20 ]); // Incomplete packet!
    var client = dgram.createSocket("udp4");
    var status = {};
    var timeout;
    
    client.on("message", function(msg, rinfo) {
        if (msg[0] === 0x09) { // Received the challenge response.
            if (timeout) clearTimeout(timeout);

            var secret = new Buffer(4);
            secret.writeInt32BE(parseInt(msg.toString('ascii', 5)), 0);

            writeBits(secret, request, 7); // Insert the challenge token into the request packet.
            client.send(request, 0, request.length, config["target-port"], config["target-ip"]);

            timeout = setTimeout(function() {
                try {
                    client.close();
                } catch (err) {} // I am a horrible person.

                callback(null);
            }, 1200);
        }
        else if (msg[0] === 0x00) { // Received the payload.
            if (timeout) clearTimeout(timeout);
            
            var payload = new payloadReader(msg, 16);
            var key = null
            var thing;
            while ((thing = payload.next()) !== null) {
                if (key === null) {
                    if (thing.toString() === "") break; // Hit the end.
                    key = thing.toString();
                }
                else {
                    status[key] = thing.toString();
                    key = null;
                }
            }

            // Now we can grab the player list:
            status.players = [];

            // Discard the "player_" header, and the null byte after it:
            payload.next();
            payload.next();

            while ((thing = payload.next()) !== null) {
                if (thing.toString() === "") break; // Done reading players.
                status.players.push(thing.toString());
            }

            if (status.players.length === 0) {
                status.players = "Nobody!";
            }
            else {
                status.players = status.players.join(", ");
            }

            client.close();
            callback(status);
        }
        else {
            console.log("Unknown message received from server. Hanging up.");
            client.close();
        }
    });

    client.send(handshake, 0, handshake.length, config["target-port"], config["target-ip"], null);

    // Set a UDP receive timeout, in case the server is offline.
    timeout = setTimeout(function() {
        try {
            client.close();
        } catch (err) {} // I am a horrible person.

        callback(null);
    }, 1200);
};

writeBits = function(bits, buffer, offset) {
    for (var i = 0; i < bits.length && (i + offset) < buffer.length; ++i) {
        buffer.writeUInt8(bits[i], (i + offset));
    }
};

sendRequest = function(buffer, socket, port, ip) {

    while (response === undefined) {}
    return response;
};

payloadReader = function(msg, offset) {
    this.msg = msg;
    this.position = offset;

    this.next = function() {
        if (this.position >= this.msg.length) return null;
        var i = this.position;
        while (msg[i] !== 0x00) { ++i; }
        // Note to future me: yes, I skipped adding the null character on purpose. JS doesn't like it.

        current = this.position;
        this.position = i + 1;

        return msg.slice(current, i);
    }
};

generatePage = function(data, template, callback) {
    fs.readFile(template, 'utf8', function(err, fileData) {
        var regex = /%%(.+?)%%/g
        var result;
        fileData = fileData.replace(regex, function(match) {
            match = match.substring(2, match.length - 2);
            return data[match];
        });
        callback(fileData);
    });
};

