const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

// determine active port
const port = process.env.PORT || process.env.NODE_PORT || 3000;

// read client html into memory
const index = fs.readFileSync(`${__dirname}/../client/index.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`listening on 127.0.0.1: ${port}`);

// pass http server into socketio
const io = socketio(app);

const set = {};

// join logic, adds users to room1
const onJoined = (sock) => {
  const socket = sock;

  socket.on('join', () => {
    console.log('joining room...');
    socket.join('room1');
  });
};

// adds new shape and send to client
const onAddRequest = (sock) => {
  const socket = sock;

  socket.on('requestShape', (data) => {
    console.log('adding shape...');

    set[data.t] = { x: data.x, y: data.y, t: data.t, type: 1 };

    // send local
    socket.emit('serveShape', { x: data.x, y: data.y, t: data.t, type: 0 });
    // broadcast remote
    socket.broadcast.emit('serveShape', { x: data.x, y: data.y, t: data.t, type: 1 });
  });
  socket.on('requestInitialSet', () => {
    console.log('sending set to new user...');

    // send set
    socket.emit('serveInitialSet', set);
  });
};

// disconnect logic, removes users from room1
const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', () => {
    console.log('disconnecting from server...');
    socket.leave('room1');
  });
};

// connect logic, attaches events
io.sockets.on('connection', (socket) => {
  console.log('connecting');

  onJoined(socket);
  onAddRequest(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');
