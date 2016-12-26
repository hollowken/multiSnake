var server = require('http').createServer(),
	url = require('url'),
	WebSocketServer = require('ws').Server,
	wss = new WebSocketServer({ server: server }),
	express = require('express'),
	app = express(),
	port = 8000;

const MAX_WIDTH = 25;
const MAX_HEIGHT = 20;

class Snake {

	constructor(id) {
		this.snakeCoords = [
			[4, id],
			[3, id],
			[2, id],
			[1, id]
		];
		this.direction = 'right';
	}

	addTail() {
		let snake = this.snakeCoords;
		snake.push([snake[snake.length-1][0], snake[snake.length-1][1]]);
	}

	setDirection(dir) {
		this.direction = dir;
	}

	get getDirection() {
		return this.direction;
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

class Player {
	constructor(id) {
		this.id = id;
		this.ready = false;
		this.color = 'Синий';
		this.snake = new Snake(id);
		this.score = 0;
		this.alive = true;
	}

	get getColor() {
		return this.color;
	}

	get getID() {
		return this.id;
	}

	get isReady() {
		return this.ready;
	}

	get isAlive() {
		return this.alive;
	}

	get getScore() {
		return this.score;
	}

	get getSnake() {
		return this.snake;
	}

	swapAlive() {
		this.alive = !this.alive;
	}

	swapReady() {
		this.ready = !this.ready;
	}

	setColor(color) {
		this.color = color;
	}

	incScore() {
		this.score++;
	}

	die () {
		this.alive = false;
		this.snake = null;
	}
}

class Game {
	constructor() {
		this.started = false;
		this.players = [];
		this.field = new Field();
		this.lobbyCountdown = 5;
		this.timeout = null;
		this.gameupd = null;
		this.winner = -1;
	}

	get hasStarted() {
		return this.started;
	}

	get getPlayers() {
		return this.players;
	}

	getPlayer(id) {
		return this.players[id];
	}

	get getField() {
		return this.field;
	}

	get getPlayerLen() {
		return this.players.length;
	}

	get lobbyInfo() {
		let info = [];
		this.players.forEach(function(el) {
			info[el.getID] = {
				ftext: el.getColor + ' игрок - ',
				stext: (el.isReady) ? '<span class="ready">готов</span>' : '<span class="unready">не готов</span>'
			};
		});

		return info;
	}

	stopTimeout() {
		clearTimeout(this.timeout);
		this.timeout = null;
	}

	startTimeout() {
		this.timeout = setTimeout(function(){
			if(game.hasStarted) return false;
			game.started = true;
			this.gameupd = setInterval(updateSnake, 170);
			wss.broadcast(JSON.stringify({type: 'gameStarted'}));
		}, 5000);
	}

	updateLobby() {
		wss.broadcast(JSON.stringify({type: 'updateLobby', info: this.lobbyInfo}));
	}

	swapStarted() {
		this.started = !this.started;
	}

	addPlayer() {
		this.players.push(new Player(this.players.length));
	}

	removePlayer(id) {
		this.players.splice(id, 1);
	}

	checkReadyPlayers() {
		let count = 0;
		players.forEach(function(el) {
			if(el.isReady) count++;
		});

		return (count === this.players.length) ? true : false;
	}

	checkWinner() {
		if(game.winner != -1) return false;
		let data;
		this.players.forEach(function(el) {
			if(!el.isAlive) return false;
			if(el.getScore >= 15 || game.checkLastSurvive()) {
				data = JSON.stringify({type: 'info', text: el.getColor + ' игрок выиграл игру!'});
				game.winner = el.getID;
			}
			else return false;
		});
		if(data) {
			wss.broadcast(data);
			wss.broadcast(JSON.stringify({type: 'gameEnd'}));
		} 
	}

	checkLastSurvive() {
		let count = 0;
		this.players.forEach( function(el) {
			if(el.isAlive) count++;
		});
		return (count === 1) ? true : false;
	}

}

var game = new Game();

function updateSnake() {
	if(!game.hasStarted) return true;
	let field = game.getField;
	let players = game.getPlayers;
	field.clearField();
	let data;

	players.forEach(function(pl) {
		let el = pl.getSnake;
		if (el === null) return true;
		el.moveSnake();
		let coords = el.getSnakeCoords;
		for(var i = 0; i < coords.length; i++) {
			field.setField(coords[i][0], coords[i][1], pl.getColor);
		}
		if(el.checkForCollision()) {
			let text;
			text = pl.getColor + ' игрок съел сам себя!';
			pl.die();
			wss.broadcast(JSON.stringify({type: 'info', text: text}));
			return game.checkWinner();
		}

		if(el.checkFruct(field.getFructPos)) {
			el.addTail();
			pl.incScore();
			game.checkWinner();
			data = JSON.stringify({type: 'updateScore', id: pl.getID, score: pl.getScore});
			wss.broadcast(data);
			field.generateFruct();
		}
	});

	let fruct = field.getFructPos;
	field.setField(fruct[0], fruct[1], 'f');

	let coords = field.getField;
	data = JSON.stringify({type: 'update', coords: coords});
	wss.broadcast(data);
}

wss.broadcast = function broadcast(data) {
	wss.clients.forEach(function each(client) {
		client.send(data);
	});
};

wss.on('connection', function connection(ws) {

	if(game.hasStarted) return ws.close(228, 'Game is already started, wait');
	if(game.getPlayerLen >= 4) return ws.close(1488, 'Server is full');
	let id = game.getPlayerLen;
	game.addPlayer();
	ws.send(JSON.stringify({type: 'setID', id: id}));
	game.updateLobby();

	ws.on('message', function(message) {

		message = JSON.parse(message);
		let data;

		switch(message['type']) {
			case 'changeDir':
				let snake = game.getPlayer(id).getSnake;
				snake.setDirection(message['dir']);
				break;
			case 'ready':
				let player = game.getPlayer(id);
				player.swapReady();
				game.updateLobby();
				if(player.isReady) {
					if(game.checkReadyPlayers) {
						wss.broadcast(JSON.stringify({type: 'startGame'}));
						game.startTimeout();
					}
				} else {
					game.stopTimeout();
					wss.broadcast(JSON.stringify({type: 'stopStart'}));
				}
				break;
			case 'changeColor':
				game.getPlayer(id).setColor(message['color']);
				game.updateLobby();
				break;
		}
		
	});

	ws.on('close', function(code, reason) {
		if(game.getPlayerLen === 1) return game = new Game();
		if(game.hasStarted){
			wss.send(JSON.stringify({type: 'info', text: game.getPlayer(id).getColor + ' игрок трусливо сбежал!'}));
			game.removePlayer(id);
		} else{
			game.removePlayer(id);
			game.updateLobby();
		}
		
	});

});

server.listen(port);