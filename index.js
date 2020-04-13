const canvas = document.getElementById("mainCanvas");
const context = canvas.getContext("2d");
const bgCanvas = document.getElementById("backgroundCanvas");
const bgContext = bgCanvas.getContext("2d");
const stickCanvas = document.getElementById("stickCanvas");
const stickContext = stickCanvas.getContext("2d");

const dimensions = new Vec(28, 36);
const ts = 16;

let score;
let highscore = 0;
let level;
let controllable;
let ready;
let menu;

let p;
let fruitTimer;
let ghosts;
let board;
let tick;
let dotCount;
let voiceTimer;
let frightenedTimer;

const setup = () => {
	level = 0;
	board = STATIC_BOARD.map((x) => x.map((y) => y));
	menu = true;

	p = new Player();

	ghosts = [];
	ghosts.push(new Red(new Vec(13, 14), new Vec(7, 0), "chase"));
	ghosts.push(new Pink(new Vec(13, 17), new Vec(7, 0), "jail"));
	ghosts.push(new Blue(new Vec(12, 17), new Vec(-3, 0), "jail"));
	ghosts.push(new Orange(new Vec(15, 17), new Vec(3, 0), "jail"));

	score = 0;
	tick = 0;
	dotCount = 240;
	voiceTimer = 1000;
	fruitTimer = 0;
	controllable = true;
	ready = false;

	updateState();
	drawMenu();
};

const update = () => {
	if (!menu) {
		if (ready && controllable) {
			updateControls();
			p.update();
			ghosts.forEach((g) => {
				g.update();
			});
			updateState();
		}
		draw();
	} else {
		drawMenu();
		drawStick();
	}
	requestAnimationFrame(update);
};

const draw = () => {
	context.clearRect(0, 0, canvas.width, canvas.height);
	bgContext.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
	bgContext.drawImage(backgroundImage, 0, 0);
	for (let y = 0; y < board.length; y++) {
		for (let x = 0; x < board[y].length; x++) {
			if (board[y][x] === 0) {
				bgContext.fillStyle = "#242424";
				bgContext.fillRect(x * ts + 6, y * ts + 6, ts - 12, ts - 12);
			} else if (board[y][x] === 4) {
				bgContext.save();
				bgContext.shadowColor = "rgba(0, 0, 0, 0.9)";
				bgContext.shadowOffsetX = -1;
				bgContext.shadowOffsetY = 1;
				bgContext.shadowBlur = 4;
				bgContext.drawImage(powerupImage, x * ts, y * ts);
				bgContext.restore();
			} else if (board[y][x] === 5) {
				bgContext.save();
				bgContext.shadowColor = "rgba(0, 0, 0, 0.9)";
				bgContext.shadowOffsetX = -1;
				bgContext.shadowOffsetY = 1;
				bgContext.shadowBlur = 8;
				bgContext.drawImage(fruitImage, x * ts, y * ts);
				bgContext.restore();
			}
		}
	}

	if (!ready) {
		context.textAlign = "center";
		context.font = "16px 'Press Start 2P'";
		context.fillStyle = "#ffd500";
		context.fillText("READY!", 224, 336);
		context.fillStyle = "#121212";
		context.fillText("READY!", 226, 335);
	}

	//draw scoreboard
	context.fillStyle = "white";
	context.textAlign = "right";
	context.font = "16px 'Press Start 2P'";
	context.fillText("SCORE", 128, 22);
	if (score === 0) {
		context.fillText("00", 120, 42);
	} else {
		context.fillText(score, 120, 42);
	}

	context.fillText("HIGHSCORE", 400, 22);
	if (highscore === 0) {
		context.fillText("00", 390, 42);
	} else {
		context.fillText(highscore, 390, 42);
	}

	context.textAlign = "center";
	context.fillText("LEVEL " + (level + 1), 224, 569);

	//draw lives
	for (let i = 1; i < p.lives; i++) {
		bgContext.drawImage(pacImage, 24, 0, 24, 24, 32 * i - 14, 548, 24, 24);
	}

	//draw gotten fruits
	for (let i = 0; i < p.fruitCount; i++) {
		bgContext.drawImage(fruitImage, 0, 0, 24, 24, 24 * i + 390, 552, 24, 24);
	}

	ghosts.forEach((g) => {
		g.draw();
	});
	p.draw();
	ghosts.forEach((g) => {
		if (g.voiceLine) {
			g.drawVoiceLine();
		}
	});
};

let stick;
const updateControls = () => {
	if (stick && controllable) {
		if (stick.x !== 0 || stick.y !== 0) {
			if (p.canMove(stick)) {
				p.dir = new Vec(stick.x, stick.y);
			}
		}
	}
	drawStick();
};

const drawStick = () => {
	stickContext.clearRect(0, 0, 160, 160);
	if (menu || !stick || (stick.x === 0 && stick.y === 0)) {
		stickContext.drawImage(stickImage, 0, 0, 60, 60, 20, 20, 120, 120);
	} else if (stick.x === 1 && stick.y === 0) {
		stickContext.drawImage(stickImage, 60, 0, 60, 60, 20, 20, 120, 120);
	} else if (stick.x === -1 && stick.y === 0) {
		stickContext.drawImage(stickImage, 120, 0, 60, 60, 20, 20, 120, 120);
	} else if (stick.x === 0 && stick.y === -1) {
		stickContext.drawImage(stickImage, 180, 0, 60, 60, 20, 20, 120, 120);
	} else if (stick.x === 0 && stick.y === 1) {
		stickContext.drawImage(stickImage, 240, 0, 60, 60, 20, 20, 120, 120);
	}
};

const updateState = () => {
	//update ghosts
	if (ghosts[0].mode === "frightened" || ghosts[1].mode === "frightened" || ghosts[2].mode === "frightened" || ghosts[3].mode === "frightened") {
		if (frightenedTimer === 0) {
			ghosts.forEach((g) => {
				if (g.mode !== "jail" && g.mode !== "shame") {
					g.mode = getMode();
					let index = 0;
					if (level > 0 && level < 4) {
						index = 1;
					} else if (level > 3) {
						index = 2;
					}
					g.speed = ghostChaseSpeeds[index];
					ghosts[0].updateSpeed();
				}
			});
		}
		frightenedTimer--;
	} else {
		ghosts.forEach((g) => {
			if (g.mode !== "jail" && g.mode !== "shame") {
				const newMode = getMode();
				if (g.mode !== newMode) {
					g.mode = newMode;
					g.reverse();
				}
			}
		});
		ghosts[0].updateSpeed();
		tick++;
	}

	//update game
	if (fruitTimer > 0) {
		fruitTimer--;
		if (fruitTimer === 0) {
			board[20][13] = 3;
		}
	} else if (dotCount === 70 || dotCount === 170) {
		fruitTimer = 600;
		board[20][13] = 5;
	}
	if (dotCount === 0) {
		dotCount = 240;
		controllable = false;
		setTimeout(() => {
			level++;
			board = STATIC_BOARD.map((x) => x.map((y) => y));
			resetPlayer();
			resetGhosts();
			tick = 0;
			voiceTimer = 1000;
			fruitTimer = 0;
			controllable = true;
			ready = false;
			setTimeout(() => {
				ready = true;
			}, 2000);
			let index = 0;
			if (level > 0 && level < 4) {
				index = 1;
			} else if (level > 3) {
				index = 2;
			}
			ghosts.forEach((g) => {
				g.speed = ghostChaseSpeeds[index];
			});
			if (level > 20) {
				index = 3;
			}
			p.speed = playerSpeeds[index];
			updateState();
		}, 1000);
	}
	if (voiceTimer > 0) {
		voiceTimer--;
		if (voiceTimer === 700) {
			ghosts.forEach((g) => {
				g.voiceLine = undefined;
			});
		}
	} else {
		for (const g of ghosts) {
			if (g.pos.distance(p.pos) < 7 && g.mode !== "jail" && g.mode !== "shame") {
				voiceTimer = 1000;
				g.voiceLine = voiceLines[Math.floor(Math.random() * voiceLines.length)];
				return;
			}
		}
	}
};

const getMode = () => {
	let index = 0;
	if (level > 0 && level < 4) {
		index = 1;
	} else if (level > 3) {
		index = 2;
	}
	const intervals = scatterTimes[index];
	const tickSec = tick / 60;

	let totalInterval = 0;
	for (let i = 0; i < intervals.length; i++) {
		totalInterval += intervals[i];
		if (tickSec < totalInterval) {
			if (i % 2 === 0) {
				return "scatter";
			} else {
				return "chase";
			}
		}
	}
	return "chase";
};

const resetGhosts = () => {
	ghosts[0].pos = new Vec(13, 14);
	ghosts[0].offset = new Vec(7, 0);
	ghosts[0].mode = "chase";
	ghosts[0].dir = new Vec(-1, 0);
	ghosts[0].nextDir = new Vec(-1, 0);
	ghosts[1].pos = new Vec(13, 17);
	ghosts[1].offset = new Vec(7, 0);
	ghosts[1].mode = "jail";
	ghosts[2].pos = new Vec(12, 17);
	ghosts[2].offset = new Vec(-3, 0);
	ghosts[2].mode = "jail";
	ghosts[3].pos = new Vec(15, 17);
	ghosts[3].offset = new Vec(3, 0);
	ghosts[3].mode = "jail";
	ghosts.forEach((g) => {
		g.voiceLine = undefined;
	});
};

resetPlayer = () => {
	p.offset = new Vec(7, 0);
	p.pos = new Vec(13, 26);
	p.dir = new Vec(-1, 0);
	p.animation = 0;
	p.dotTimer = 0;
	p.alive = true;
	p.fruitCount = 0;
};

const drawMenu = () => {
	context.drawImage(menuImage, 0, 0);
	context.fillStyle = "red";
	context.textAlign = "center";
	context.font = "36px 'Press Start 2P'";
	context.fillText("COVID-19", 190, 90);
	context.fillStyle = "yellow";
	context.fillText("PAC-MAN", 243, 140);
	context.fillStyle = "white";
	context.font = "18px 'Press Start 2P'";
	context.fillText("PRESS ANY BUTTON", 224, 346);
	context.fillText("TO START", 224, 380);
	context.font = "16px 'Press Start 2P'";
	context.fillText("ELIJAH CIRIOLI", 224, 560);
};

//difficulty variables
const playerSpeeds = [1.6, 1.8, 2, 1.8];
const ghostChaseSpeeds = [1.5, 1.7, 1.9];
const ghostFrightenedSpeeds = [1, 1.1, 1.2];
const frightenedTimes = [7, 5, 2, 0];
const scatterTimes = [
	[7, 20, 7, 20, 5, 20, 5],
	[7, 20, 7, 20, 5],
	[5, 20, 5, 20, 5],
];
const tunnelSpeeds = [0.8, 0.9, 1];

document.onkeydown = (e) => {
	e = window.event || e;
	const key = e.keyCode;
	e.preventDefault();

	if (menu) {
		menu = false;
		setTimeout(() => {
			ready = true;
		}, 2000);
	} else {
		switch (key) {
			case 38:
				stick = new Vec(0, -1);
				break;
			case 40:
				stick = new Vec(0, 1);
				break;
			case 37:
				stick = new Vec(-1, 0);
				break;
			case 39:
				stick = new Vec(1, 0);
				break;
		}
	}
};

document.onkeyup = (e) => {
	e = window.event || e;
	const key = e.keyCode;
	e.preventDefault();

	if (!menu && stick) {
		switch (key) {
			case 38:
				if (stick.y === -1) {
					stick.y = 0;
				}
				break;
			case 40:
				if (stick.y === 1) {
					stick.y = 0;
				}
				break;
			case 37:
				if (stick.x === -1) {
					stick.x = 0;
				}
				break;
			case 39:
				if (stick.x === 1) {
					stick.x = 0;
				}
				break;
		}
	}
};

let pointerDown;
document.onpointerup = (e) => {
	pointerDown = false;
};
stickCanvas.onpointerdown = (e) => {
	handlePointerSet(e);
	pointerDown = true;
};
stickCanvas.onpointermove = (e) => {
	if (pointerDown) {
		handlePointerSet(e);
	}
};
stickCanvas.onpointerup = (e) => {
	handlePointerStop(e);
	pointerDown = false;
};
stickCanvas.onpointerleave = (e) => {
	handlePointerStop(e);
};

handlePointerSet = (e) => {
	e = window.event || e;
	e.preventDefault();

	if (menu) {
		menu = false;
		setTimeout(() => {
			ready = true;
		}, 2000);
	} else {
		const rect = e.target.getBoundingClientRect();
		const x = e.clientX - rect.left - 80;
		const y = e.clientY - rect.top - 80;
		const angle = Math.atan2(y, x);
		const pi = Math.PI / 4;
		if (angle > -pi && angle < pi) {
			stick = new Vec(1, 0);
		} else if (angle > pi && angle < 3 * pi) {
			stick = new Vec(0, 1);
		} else if (Math.abs(angle) > 3 * pi) {
			stick = new Vec(-1, 0);
		} else if (angle < -pi && angle > -3 * pi) {
			stick = new Vec(0, -1);
		}
	}
};

handlePointerStop = (e) => {
	e = window.event || e;
	e.preventDefault();

	if (!menu && stick) {
		stick = new Vec(0, 0);
	}
};

document.onpointerdown = (e) => {
	pointerDown = true;
	if (menu) {
		menu = false;
		setTimeout(() => {
			ready = true;
		}, 2000);
	}
};

//key: 0 = pellet, 1 = wall, 2 = unused space, 3 = no pellet path, 4 = powerup, 5 = fruit
const STATIC_BOARD = [
	[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
	[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
	[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
	[1, 4, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 4, 1],
	[1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1],
	[1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
	[1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 3, 1, 1, 3, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
	[2, 2, 2, 2, 2, 1, 0, 1, 1, 1, 1, 1, 3, 1, 1, 3, 1, 1, 1, 1, 1, 0, 1, 2, 2, 2, 2, 2],
	[2, 2, 2, 2, 2, 1, 0, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 0, 1, 2, 2, 2, 2, 2],
	[2, 2, 2, 2, 2, 1, 0, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 0, 1, 2, 2, 2, 2, 2],
	[1, 1, 1, 1, 1, 1, 0, 1, 1, 3, 1, 3, 3, 3, 3, 3, 3, 1, 3, 1, 1, 0, 1, 1, 1, 1, 1, 1],
	[3, 3, 3, 3, 3, 3, 0, 3, 3, 3, 1, 3, 3, 3, 3, 3, 3, 1, 3, 3, 3, 0, 3, 3, 3, 3, 3, 3],
	[1, 1, 1, 1, 1, 1, 0, 1, 1, 3, 1, 3, 3, 3, 3, 3, 3, 1, 3, 1, 1, 0, 1, 1, 1, 1, 1, 1],
	[2, 2, 2, 2, 2, 1, 0, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 0, 1, 2, 2, 2, 2, 2],
	[2, 2, 2, 2, 2, 1, 0, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 0, 1, 2, 2, 2, 2, 2],
	[2, 2, 2, 2, 2, 1, 0, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 0, 1, 2, 2, 2, 2, 2],
	[1, 1, 1, 1, 1, 1, 0, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 0, 1, 1, 1, 1, 1, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
	[1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
	[1, 4, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 4, 1],
	[1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1],
	[1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1],
	[1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
	[1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
	[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
];

const backgroundImage = new Image();
backgroundImage.src = "/background.png";
const pacImage = new Image();
pacImage.src = "/pacSprite.png";
const redImage = new Image();
redImage.src = "/redSprite.png";
const blueImage = new Image();
blueImage.src = "/blueSprite.png";
const pinkImage = new Image();
pinkImage.src = "/pinkSprite.png";
const orangeImage = new Image();
orangeImage.src = "/orangeSprite.png";
const frightenedImage = new Image();
frightenedImage.src = "/frightSprite.png";
const powerupImage = new Image();
powerupImage.src = "/powerupSprite.png";
const deathImage = new Image();
deathImage.src = "/deathSprite.png";
const fruitImage = new Image();
fruitImage.src = "/fruitSprite.png";
const menuImage = new Image();
menuImage.src = "/menuImage.png";
const stickImage = new Image();
stickImage.src = "/stickSprite.png";

const voiceLines = [
	"SOCIAL DISTANCING,\nBUDDY",
	"WATCH IT!",
	"I'M WALKING HERE!",
	"SIX FEET!",
	"STAY BACK",
	"KEEP YOUR\nDISTANCE",
	"FLATTEN THAT\nCURVE!",
	"STAY SIX FEET AWAY",
	"TRY SOCIAL\nDISTANCING",
	"EXCUSE ME.",
	"I'M TRYING TO\nGET THROUGH",
	"LOOK OUT!",
	"COMING THROUGH",
	"KEEP A WIDE\nBERTH",
	"DON'T COME\nANY CLOSER",
	"DISTANCE YOURSELF\nSOCIALLY",
	"YOU'RE GETTING WAY\nTOO CLOSE, PAL",
	"THIS IS NOT SIX FEET!",
	"I CAN FEEL THE\nCURVE GETTING HIGHER",
	"THIS IS CLEARLY\nNOT SIX FEET",
	"GET AWAY FROM ME!",
	"DON'T GET\nANY IDEAS",
	"EASY THERE, BUD",
	"I'M NOT WEARING\nA MASK, BE CAREFUL",
	"STOP HOARDING\nYOU COW!",
	"IT'S CALLED\nPERSONAL SPACE",
	"I FEEL SICK\nALREADY",
	"SIR, PLEASE\nSLOW DOWN.",
	"NEXT TIME\nSTAY HOME",
	"PERSONAL SPACE!",
	"GET LOST, KID",
];

document.onload = setup();
requestAnimationFrame(update);
