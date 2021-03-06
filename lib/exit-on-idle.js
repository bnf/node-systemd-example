/* TODO: move into an own npm module, once we're happy with the function naming */

exports.onIdle = function(close, delay, wait) {
	delay = delay || 30000;
	wait = wait || false;
	var timeout = null;

	if (!wait) {
		timeout = setTimeout(close, delay);
	}
	return function(socket) {
		var server = this;
		if (timeout !== null) {
			clearTimeout(timeout);
			timeout = null;
		}
		socket.once('close', function() {
			console.log("exit-on-idle: retrieved socket close");
			/* Server is closed */
			if (!server._handle) return;
			server.getConnections(function(err, count) {
				if (err) return;
				/* Server is closed */
				if (!server._handle) return;

				if (count === 0) {
					if (timeout === null) {
						timeout = setTimeout(close, delay);
					}
				}
			});
		});
	};
};
