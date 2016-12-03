const http = require('http');
const sd = require('systemd-daemon');
const hgc = require('./lib/http-graceful-close');
const eoi = require('./lib/exit-on-idle');

sd.watchdog.start();

const handle = sd.socket() || 3000;

const server = http.createServer((req, res) => {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/plain');
	res.end('Hello World\n');
});

const close = (exitCode) => {
	return () => {
		process.exitCode = exitCode ? exitCode : 0;
		sd.notify("STOPPING=1");
		server.emit('http-graceful-close');
		server.close(() => {
			sd.watchdog.stop();
		});
	};
};

server.on('connection', hgc.onConnection);
server.on('connection', eoi.onIdle(close(), 30000));

server.listen(handle, () => {
	sd.notify("READY=1");
	/* 111 is convention between this process and the systemd service.
	 * .. trigger systemd to restart the process. */
	process.on('SIGHUP', close(111));
});
