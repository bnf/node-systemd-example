const http = require('http');
const sd = require('systemd-daemon');
const hgc = require('./lib/http-graceful-close');

const handle = sd.socket() || 3000;

const server = http.createServer((req, res) => {
	setTimeout(() => {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/plain');
		res.end('Hello World\n');
	}, 5000);
});

hgc.prepare(server);

process.on('SIGHUP', function() {
	sd.notify("STOPPING=1");
	/* 111 is convention between this process and the systemd service.
	 * .. trigger systemd to restart the process. */
	process.exitCode = 111;
	hgc.close(server);
});

server.listen(handle, () => {
	sd.notify("READY=1");
});
