const http = require('http');
const sd = require('systemd-daemon');
const hgc = require('./lib/http-graceful-close');
const eoi = require('./lib/exit-on-idle');

sd.watchdog.start();

const handle = sd.socket() || 3000;

const server = http.createServer((req, res) => {
	setTimeout(() => {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/plain');
		res.end('Hello World\n');
	}, 5000);
});

const exit = (code, status) => {
	status = status || 'Terminating...';
	return () => {
		sd.notify("STOPPING=1\nSTATUS=" + status);
		server.emit('http-graceful-close');
		server.close(() => {
			sd.watchdog.stop();
			if (code) {
				process.exitCode = code;
			}
		});
	};
};

hgc.inject(server);
server.on('connection', eoi.onIdle(exit(), 30000));

server.listen(handle, () => {
	sd.notify("READY=1");

	/* We want to restart the entire service on SIGHUP (to perform reload),
	 * so let#s inform systemd about this with the special exit code 133.
	 * The service file RestartForceExitStatus=133 so that this results in
	 * a service restart. */
	process.on('SIGHUP', exit(133, 'Restarting...'));
});

process.on('exit', (code) => {
	console.log(`About to exit with code: ${code}`);
});
