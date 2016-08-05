const http = require('http');
const sd = require('systemd-daemon');

const handle = sd.socket() || 3000;

const server = http.createServer((req, res) => {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/plain');
	res.end('Hello World\n');
});

server.listen(handle, () => {
	sd.notify("READY=1");
});
