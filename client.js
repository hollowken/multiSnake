/* 
	Size of game field (20x25) 
	32x32 pixels - size of any object on the screen,
	so 800 / 32 = 25 and 640 / 32 = 20
*/
const MAX_WIDTH = 25;
const MAX_HEIGHT = 20;
// ...................

/*
	Main variables of project
*/
var direction = 'right',   // snake moving direction
	headCoords = [4, 4],   // x, y - position of snake head
	fructCoords = [8, 12], // x, y - position of fruct
	fructSpawned = true,   // Does have spawned fruct or no
	tailCoords = [],	   // Array of all tail elements (without head)
	ws = new WebSocket('ws://localhost:3000'),
	id;
// ....................

ws.onopen = function() {
	console.log('Соединение установлено.');
	ws.send("new");
}

ws.onmessage = function(event) {
	console.log("Получены данные: " + event.data);
	let data = JSON.parse(event.data);
	console.log(data['type']);
}

ws.onerror = function(event) {
	console.log(event.data);
}

// function that returns a random number
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
// ....................

// load game sprites
function preload() {
	game.load.image('head', 'assets/head.png');
	game.load.image('tail', 'assets/tail.png');
	game.load.image('fruct', 'assets/fruct.png');
}
// ....................

// Game initialization
function create() {
	game.stage.backgroundColor = '#71c5cf'; // Background color

	game.head = game.add.sprite(headCoords[1]*32, headCoords[0]*32, 'head'); // Snake head object
	game.fruct = game.add.sprite(fructCoords[1]*32, fructCoords[0]*32, 'fruct'); // Fruct object

	// first element - tail object, then X and Y
	tailCoords = [
		[game.add.sprite(4,3,'tail'), 3, 4],
		[game.add.sprite(4,2,'tail'), 2, 4],
		[game.add.sprite(4,1,'tail'), 1, 4],
	];
	// ....................

	// get keys for WASD control
    var wKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
    var sKey = game.input.keyboard.addKey(Phaser.Keyboard.S);
    var aKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
    var dKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
    // ....................

    // functions that change moving direction of Snake by WASD keys
    wKey.onDown.add(function() {
    	direction = 'up';
    	console.log(ws.ID);
    }, this);
    sKey.onDown.add(function() {
    	direction = 'down';
    }, this);
    aKey.onDown.add(function() {
    	direction = 'left';
    }, this);
    dKey.onDown.add(function() {
    	direction = 'right';
    }, this);
    // ....................

    setInterval(updateSec, 300); // Game speed, function that updates every 0.3 sec and change the coords of snake
}
// ....................

// game cycle
function update() {

	// if frusct isn't spawned - spawn it
	if(!fructSpawned) {
		var x = randomInt(1, MAX_WIDTH-2);  // random X pos
		var y = randomInt(1, MAX_HEIGHT-2); // random Y pos
		fructCoords = [x, y]; 				// change coords of fruct
		fructSpawned = true;				// fruct has been spawned
	}
	// ....................

	// if snake head on the fruct coords - pick it
	if(headCoords[0] === fructCoords[0] && headCoords[1] === fructCoords[1]) {
		fructSpawned = false; 											// fruct now isn't spawned
		var x = tailCoords[tailCoords.length-1][1];						// get X of last tail object 
		var y = tailCoords[tailCoords.length-1][2];						// get Y of last tail object
		tailCoords.push([game.add.sprite(y*32, x*32, 'tail'), x, y]);   // add tail object in the end of snake
	}
	// ....................

	// render fruct and snake head sprite's
	game.fruct.x = fructCoords[0]*32; 
	game.fruct.y = fructCoords[1]*32;

	game.head.x = headCoords[0]*32;
	game.head.y = headCoords[1]*32;
	// ....................

	// check for collision head with tail
	// for every tail object
	for(var i = 0; i < tailCoords.length; i++) {
		tailCoords[i][0].x = tailCoords[i][1]*32; 													// x
		tailCoords[i][0].y = tailCoords[i][2]*32; 													// y
		if(tailCoords[i][1] === headCoords[0] && tailCoords[i][2] === headCoords[1]) restartGame(); // if x and y of snake head = x and y of tail then restart game
	}
	// ....................

}
// ....................

// update snake coords every 0.3 sec
function updateSec() {

	// update tail coords
	// for every tail object
	for(var i = tailCoords.length-1; i >= 0 ; i--)
	{
		if (i === 0) {
			tailCoords[i][1] = headCoords[0];
			tailCoords[i][2] = headCoords[1];
		} 
		else {
			tailCoords[i][1] = tailCoords[i-1][1];
			tailCoords[i][2] = tailCoords[i-1][2];
		}
	} 
	// ....................

	// move snake head according to moving direction
	switch(direction) {
		case 'left':
			headCoords[0]--;
			if(headCoords[0] < 0) headCoords[0] = MAX_WIDTH-1;
			break;
		case 'right':
			headCoords[0]++;
			if(headCoords[0] > MAX_WIDTH-1) headCoords[0] = 0;
			break;
		case 'up':
			headCoords[1]--;
			if(headCoords[1] < 0) headCoords[1] = MAX_HEIGHT-1;
			break;
		case 'down':
			headCoords[1]++;
			if(headCoords[1] > MAX_HEIGHT-1) headCoords[1] = 0;
			break;
	}
	// ....................
}
// ....................

// function that delete tail objects and set variables to default values
function restartGame() {

	for (var i = tailCoords.length - 1; i >= 0; i--) {
		tailCoords[i][0].destroy();
		tailCoords.pop();
	}

	tailCoords = [
		[game.add.sprite(4,3,'tail'), 3, 4],
		[game.add.sprite(4,2,'tail'), 2, 4],
		[game.add.sprite(4,1,'tail'), 1, 4]
	];

	direction = "right";
	headCoords = [4, 4];
	fructSpawned = true;
	fructCoords = [8, 12];
}
// ....................

var game = new Phaser.Game(800, 640, Phaser.AUTO, '', { preload: preload, create: create, update: update });