var WebSocketServer = require('ws').Server,
	wss = new WebSocketServer({port: 3000}),
	countID = 0;

wss.broadcast = function broadcast(data) {
	wss.clients.forEach(function each(client) {
		client.send(data);
	});
};

wss.on('connection', function connection(ws) {

	ws.on('message', function(message) {

		if(message === "new") {
			console.log('new player: ' + countID);
			ws.send(JSON.stringify({type: 'new', id: countID}));
			return countID++;
		}

		wss.clients.forEach(function each(client) {
			client.send(message);
		});
	});

	ws.on('close', function(code, reason) {
		countID--;
	});

});
