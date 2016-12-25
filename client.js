var ws = new WebSocket('ws://192.168.0.50:3000'),
	id,
	fieldNum,
	field = [];

const MAX_WIDTH = 25;
const MAX_HEIGHT = 20;

ws.onopen = function() {
	console.log('Соединение установлено.');
	ws.send(JSON.stringify({type: 'new'}));
}

ws.onmessage = function(event) {

	let data = JSON.parse(event.data);

	switch(data['type']) {
		case 'new':
			id = data['id'];
			break;
		case 'fructCoords':
			fructCoords = [data['x'], data['y']];
			break;
		case 'update':
			fieldNum = data['coords'];
			break;
		case 'updateScore':
			$('#score'+data['id']).text(data['score']);
			break;
		case 'scoreNull':
			$('#score0').text(0);
			$('#score1').text(0);
			break;
		case 'gameEnd':
			$(".end").show();
			$("canvas").hide();
			if(data['winner'] === 0) $('#endText').text('Победил синий игрок!');
			if(data['winner'] === 1) $('#endText').text('Победил красный игрок!');
			break;
	}
		
}

function preload() {
	game.load.image('head', 'assets/head.png');
	game.load.image('tail', 'assets/tail.png');
	game.load.image('fruct', 'assets/fruct.png');
	game.load.image('head2', 'assets/head2.png');
	game.load.image('tail2', 'assets/tail2.png');
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
			else if (el === 1 ) field[i][j].loadTexture('tail');
			else if (el === 'head1' ) field[i][j].loadTexture('head');
			else if (el === 2) field[i][j].loadTexture('tail2');
			else if (el === 'head2' ) field[i][j].loadTexture('head2');
			else if (el === 'f') field[i][j].loadTexture('fruct');
		}

	}
}

var game = new Phaser.Game(800, 640, Phaser.AUTO, '', { preload: preload, create: create, update: update });

function sendDir(dir) {
	data = JSON.stringify({type: 'changeDir', id: id, dir: dir});
	ws.send(data);
}

function sendFructCoords(x, y) {
	data = JSON.stringify({type: 'fructCoords', x: x, y: y});
	ws.send(data);
}