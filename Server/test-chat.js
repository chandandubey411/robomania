const http = require('http');

const data = JSON.stringify({
  message: "Hello"
});

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/chatbot/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTVmZmY2MTA5OWNhZDgxNjhkODYwODAiLCJyb2xlIjoidXNlciIsImRlcGFydG1lbnQiOm51bGwsImlhdCI6MTc2OTcyOTU0NiwiZXhwIjoxNzY5ODE1OTQ2fQ.p74QYnJCMTbVj0NHU6Icf-uGVKer2B4ucNZHRhqEGCE'
  }
};

const fs = require('fs');

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (d) => {
    body += d;
    process.stdout.write(d);
  });
  res.on('end', () => {
    fs.writeFileSync('chat-response.json', body);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
