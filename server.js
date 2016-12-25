var WebSocketServer = require('ws').Server,
	wss = new WebSocketServer({port: 3000}),
	countID = 0,
	players = [];

const MAX_WIDTH = 25;
const MAX_HEIGHT = 20;

setInterval(updateSnake, 170);

class Snake {

	constructor(id) {
		this.id = id;
		this.snakeCoords = [
			[4, id],
			[3, id],
			[2, id],
			[1, id]
		];
		this.direction = 'right';
		this.score = 0;
	}

	addTail() {
		let snake = this.snakeCoords;
		snake.push([snake[snake.length-1][0], snake[snake.length-1][1]]);
	}

	get getId() {
		return this.id;
	}

	set setDirection(dir) {
		this.direction = dir;
	}

	get getDirection() {
		return this.direction;
	}

	addScore() {
		this.score++;
	}

	get getScore() {
		return this.score;
	}

	get getSnakeCoords() {
		return this.snakeCoords;
	}

	set setSnakeCoords(snakeCoords) {
		this.snakeCoords = snakeCoords;
	}

	moveSnake() {

		let dir = this.direction;
		let snake = this.snakeCoords;

		for (var i = snake.length-1; i > 0 ; i--) {
			snake[i][0] = snake[i-1][0];
			snake[i][1] = snake[i-1][1];
		}

		switch(dir) {
			case 'left':
				snake[0][0]--;
				if(snake[0][0] < 0) snake[0][0] = MAX_WIDTH-1;
				break;
			case 'right':
				snake[0][0]++;
				if(snake[0][0] > MAX_WIDTH-1) snake[0][0] = 0;
				break;
			case 'up':
				snake[0][1]--;
				if(snake[0][1] < 0) snake[0][1] = MAX_HEIGHT-1;
				break;
			case 'down':
				snake[0][1]++;
				if(snake[0][1] > MAX_HEIGHT-1) snake[0][1] = 0;
				break;
		}

		this.snakeCoords = snake;
	}

	checkForCollision() {
		let snake = this.getSnakeCoords;
		for (var i = snake.length-1; i > 0 ; i--) {
			if(snake[i][0] === snake[0][0] && snake[i][1] === snake[0][1]) return true;
		}
		return false;
	}

	checkFruct(fructCoords) {
		if(this.snakeCoords[0][0] === fructCoords[0] && this.snakeCoords[0][1] === fructCoords[1]) return true;
		return false;
	}

}

class Field {

	constructor() {
		this.fructPos = [15, 10];
		this.field = [];

		for (var i = 0; i < MAX_HEIGHT; i++) {
			this.field[i] = new Array();
			for (var j = 0; j < MAX_WIDTH; j++) {
				this.field[i][j] = 0;
			}
		}
	}

	get getFructPos() {
		return this.fructPos;
	}

	get getField() {
		return this.field;
	}

	setField(x, y, val) {
		this.field[y][x] = val;
	}

	generateFruct() {
		let x = Math.floor(Math.random() * MAX_WIDTH-1) + 1;
		let y = Math.floor(Math.random() * MAX_HEIGHT-1) + 1;
		this.fructPos[0] = x;
		this.fructPos[1] = y;
	}

	clearField() {
		for (var i = 0; i < MAX_HEIGHT; i++) {
			for (var j = 0; j < MAX_WIDTH; j++) {
				this.field[i][j] = 0;
			}
		}
	}

}

var field = new Field();

function newGame() {
	players = [];
	for(var i = 0; i < countID; i++) {
		players.push(new Snake(i));
	}
	wss.broadcast(JSON.stringify({type: 'scoreNull'}));
}

function updateSnake() {
	if(players.length < 1) return true;
	field.clearField();
	let data;

	players.forEach(function(el) {
		el.moveSnake();
		let coords = el.getSnakeCoords;
		for(var i = 1; i < coords.length; i++) {
			field.setField(coords[i][0], coords[i][1], el.getId+1);
		}
		field.setField(coords[0][0], coords[0][1], 'head'+(el.getId+1));
		if(el.checkForCollision()) {
			return newGame();
		}

		if(el.checkFruct(field.getFructPos)) {
			el.addTail();
			el.addScore();
			if(el.getScore >= 15) {
				data = JSON.stringify({type: 'gameEnd', winner: el.getId});
				players = [];
				wss.broadcast(data);
			}
			data = JSON.stringify({type: 'updateScore', id: el.getId, score: el.getScore});
			wss.broadcast(data);
			field.generateFruct();
		}
	});

	let fruct = field.getFructPos;
	field.setField(fruct[0], fruct[1], 'f');

	let coords = field.getField;
	players.forEach(function(el) {
		data = JSON.stringify({type: 'update', id: el.getId, coords: coords});
		wss.broadcast(data);
	});
}

wss.broadcast = function broadcast(data) {
	wss.clients.forEach(function each(client) {
		client.send(data);
	});
};

wss.on('connection', function connection(ws) {

	ws.on('message', function(message) {

		message = JSON.parse(message);
		let data;

		switch(message['type']) {
			case 'new':
				ws.send(JSON.stringify({type: 'new', id: countID}));
				players.push(new Snake(countID));
				countID++;
				data = JSON.stringify({type: 'newPlayer'});
				newGame();
				break;
			case 'changeDir':
				players[message['id']].direction = message['dir'];
				break;
		}
		if (!data) data = JSON.stringify({type: 'none'});
		wss.broadcast(data);
		
	});

	ws.on('close', function(code, reason) {
		countID--;
		newGame();
	});

});
