const http = require('http');

const options = {
  socketPath: '\\\\.\\pipe\\chemiapp-api-f153decd95d7aa28',
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(`BODY: ${body}`));
});
req.on('error', e => console.error(e));
req.write(JSON.stringify({ username: 'admin', password: 'Admin@123' }));
req.end();
