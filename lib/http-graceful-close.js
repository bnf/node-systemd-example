var counter = 0;
var DEBUG = console.log;

exports.close = 'http-graceful-close';

exports.inject = function(server) {
	server.on('request', (req, res) => {
		req.socket._idleCount++;
		DEBUG("new request");

		res.on('finish', () => {
			if (--req.socket._idleCount == 0) {
				req.socket.emit('idle');
			}
			DEBUG("request finished");
		});
	});

	/* Keep track of connections (to close keep-alive connections on reload) */
	server.on('connection', (socket) => {

		//socket._isIdle = true;
		socket._idleCount = 0;

		var do_close = function() {
			server.setMaxListeners(Math.max(server.getMaxListeners() - 1, 0));

			if (socket._idleCount == 0) {
				//socket.setTimeout(1);
				socket.destroySoon();
			} else {
				socket.once('idle', () => {
					//socket.setTimeout(1);
					socket.destroySoon();
				});
			}
		};

		server.setMaxListeners(server.getMaxListeners() + 1);
		server.once(exports.close, do_close);

		var num = counter++;
		DEBUG("socket opened: " + num);

		socket.on('close', (had_error) => {
			server.removeListener(exports.close, do_close);
			server.setMaxListeners(Math.max(server.getMaxListeners() - 1, 0));
			DEBUG("socket closed: " + num);
		});
	});
}
