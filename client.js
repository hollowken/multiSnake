var	ws,
	id,
	fieldNum,
	field = [],
    count = 5,
    interval,
    game;

if(window.location['hostname'] === 'localhost') ws = new WebSocket('ws://localhost:8000');
else ws = new WebSocket('ws://81.23.169.28:8000');
  
function updateLobby(lobby) {
	$('.player').empty();
	for(var i = 0; i < lobby.length; i++) {
		let text = lobby[i].ftext;
		if(i === id) text = '(Я) ' + text;
		$('#'+i).text(text);
		$('#'+i).append(lobby[i].stext);
	}
}

function changeColor(sel) {
	let color = sel.value;
	ws.send(JSON.stringify({type: 'changeColor', color: color}));
}

function startGame() {
	$('.count').text('До начала игры ' + count + ' секунд(ы)');
	count--;
	if(count <= 0) {
		clearInterval(interval);
		interval = null;
		count = 5;
	}
}

$('button').click(function() {
	ws.send(JSON.stringify({type: 'ready'}));
});

const MAX_WIDTH = 25;
const MAX_HEIGHT = 20;

ws.onmessage = function(event) {

	let data = JSON.parse(event.data);

	switch(data['type']) {
		case 'setID':
			id = data['id'];
			break;
		case 'updateLobby':
			updateLobby(data['info']);
			break;
	      case 'startGame':
	        interval = setInterval(startGame, 1000);
	        break;
	      case 'stopStart':
	        clearInterval(interval);
	        interval = null;
	        count = 5;
	        $('.count').text('Ждем пока игроки будут готовы...');
	        break;
		case 'update':
			fieldNum = data['coords'];
			break;
		case 'updateScore':
			if(data['id'] != id) return true;
			$('#score').text(data['score']);
			break;
		case 'gameEnd':
			$('body').append('<a href="index.html">Сыграть еще раз?</a>');
			break;
		case 'info':
			$('body').append('<p>'+ data['text'] +'</p>');
			break;
		case 'gameStarted':
			$('.lobby').hide();
			$('.score').append('<b id="score">Счет: 0</b>');
			game = new Phaser.Game(800, 640, Phaser.AUTO, '', { preload: preload, create: create, update: update });
			break;
		case 'addPlayersScore':
			for(var i = 0; i < data['count']; i++) {
				switch (i) {
					case 0:
						$('.score').append('<b>Счет синего игрока: <span id="score0">0</span></b>');
						break;
					case 1:
						$('.score').append('<b>Счет красного игрока: <span id="score1">0</span></b>');
						break;
					case 2:
						$('.score').append('<b>Счет желтого игрока: <span id="score2">0</span></b>');
						break;
					case 3:
						$('.score').append('<b>Счет зеленого игрока: <span id="score3">0</span></b>');
						break;
				}
			}
			break;
	}
		
}

function preload() {
	game.load.image('blue', 'assets/blue.png');
	game.load.image('red', 'assets/red.png');
	game.load.image('fruct', 'assets/fruct.png');
	game.load.image('yellow', 'assets/yellow.png');
	game.load.image('green', 'assets/green.png');
	game.load.image('bg', 'assets/bg.png');
}

function create() {

    var wKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
    var sKey = game.input.keyboard.addKey(Phaser.Keyboard.S);
    var aKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
    var dKey = game.input.keyboard.addKey(Phaser.Keyboard.D);

    wKey.onDown.add(function() {
    	sendDir('up');
    }, this);
    sKey.onDown.add(function() {
    	sendDir('down');
    }, this);
    aKey.onDown.add(function() {
    	sendDir('left');
    }, this);
    dKey.onDown.add(function() {
    	sendDir('right');
    }, this);

    for (var i = 0; i < MAX_HEIGHT; i++) {
		field[i] = new Array();
		for (var j = 0; j < MAX_WIDTH; j++) {
			field[i][j] = game.add.sprite(j*32, i*32, 'bg');
		}
	}

}

function update() {
	if(!fieldNum) return true;
	for (var i = 0; i < MAX_HEIGHT; i++) {
		for (var j = 0; j < MAX_WIDTH; j++) {
			let el = fieldNum[i][j];

			if (el === 0 ) field[i][j].loadTexture('bg');
			else if (el === 'Красный' ) field[i][j].loadTexture('red');
			else if (el === 'Синий' ) field[i][j].loadTexture('blue');
			else if (el === 'Желтый') field[i][j].loadTexture('yellow');
			else if (el === 'Зеленый' ) field[i][j].loadTexture('green');
			else if (el === 'f') field[i][j].loadTexture('fruct');
		}
	}

}

function sendDir(dir) {
	data = JSON.stringify({type: 'changeDir', dir: dir});
	ws.send(data);
}