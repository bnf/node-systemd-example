var counter = 0;
var DEBUG = console.log;

exports.inject = function(server) {
	server.on('request', (req, res) => {
		req.socket._isIdle = false;
		DEBUG("new request");

		res.on('finish', () => {
			req.socket._isIdle = true;
			req.socket.emit('idle');
			DEBUG("request finished");
		});
	});

	/* Keep track of connections (to close keep-alive connections on reload) */
	server.on('connection', (socket) => {

		socket._isIdle = true;

		var do_close = function() {
			server.setMaxListeners(Math.max(server.getMaxListeners() - 1, 0));

			if (socket._isIdle) {
				socket.setTimeout(1);
			} else {
				socket.once('idle', () => {
					socket.setTimeout(1);
				});
			}
		};

		server.setMaxListeners(server.getMaxListeners() + 1);
		server.once('pre-close', do_close);

		var num = counter++;
		DEBUG("socket opened: " + num);

		socket.on('close', (had_error) => {
			server.removeListener('pre-close', do_close);
			server.setMaxListeners(Math.max(server.getMaxListeners() - 1, 0));
			DEBUG("socket closed: " + num);
		});
	});

	var oldClose = server.close;
	server.close = function(cb) {
		server.emit('pre-close');
		oldClose.call(server, cb);
	}
}
