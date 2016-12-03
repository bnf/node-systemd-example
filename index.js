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

hgc.inject(server);
server.on('connection', eoi.onIdle(close(), 30000));

server.listen(handle, () => {
	sd.notify("READY=1");

	/* We want to restart the entire service on SIGHUP (to perform reload),
	 * so let#s inform systemd about this with the special exit code 133.
	 * The service file RestartForceExitStatus=133 so that this results in
	 * a service restart. */
	process.on('SIGHUP', close(133));
});
