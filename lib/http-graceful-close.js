var connections = [];
var pending = 0;
var exit = false;
var counter = 0;

var debug = console.log;

function timeoutConnections() {
	for (var i=connections.length; i--; ) {
		connections[i].setTimeout(1);
	}
}

exports.prepare = function(server) {
	server.on('request', (req, res) => {
		debug("new request");

		pending++;
		res.on('finish', () => {
			debug("request finished (pending: " + pending + ")");
			pending--;
			if (exit && pending === 0) {
				timeoutConnections();
			}
		});
	});

	/* Keep track of connections (to close keep-alive connections on reload) */
	server.on('connection', (socket) => {
		var num = counter++;

		debug("socket opened: " + num);

		socket.on('close', (had_error) => {
			debug("socket closed: " + num);
			var index = connections.indexOf(socket);
			if (index > -1) {
				connections.splice(index, 1);
			}
		});
		socket.on('end', () => {
			console.log("socket end: " + num);
		});
		connections.push(socket);
	});
}

exports.close = function(server, callback) {
	server.close(callback);
	exit = true;

	/* Close keep-alive connections */
	debug("closing – pending: " + pending);
	if (pending === 0) {
		timeoutConnections();
	}
}
