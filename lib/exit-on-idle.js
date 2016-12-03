/* TODO: move into an own npm module, once we're happy with the function naming */
exports.onIdle = function(close, delay) {
	delay = delay || 30000;

	var timeout = null;
	return function(socket) {
		var server = this;
		if (timeout !== null) {
			clearTimeout(timeout);
			timeout = null;
		}
		socket.once('close', function() {
			server.getConnections(function(err, count) {
				if (err) return;

				if (count === 0) {
					if (timeout === null) {
						timeout = setTimeout(close, delay);
					}
				}
			});
		});
	};
};
