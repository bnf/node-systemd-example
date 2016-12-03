/* TODO: move into an own npm module, once we're happy with the function naming */

exports.onConnection = function(socket) {
	var server = this;

	var destroy = function() {
		server.setMaxListeners(Math.max(server.getMaxListeners() - 1, 0));
		socket.destroySoon();
	};

	server.setMaxListeners(server.getMaxListeners() + 1);
	server.once('http-graceful-close', destroy);

	socket.once('close', (had_error) => {
		server.removeListener('http-graceful-close', destroy);
		server.setMaxListeners(Math.max(server.getMaxListeners() - 1, 0));
	});
};
