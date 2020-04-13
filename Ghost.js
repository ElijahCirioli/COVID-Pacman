class Ghost {
	constructor(pos, offset, mode) {
		this.pos = pos;
		this.offset = offset;
		this.dir = new Vec(-1, 0);
		this.nextDir;
		this.target;
		this.maxOffset = 7;
		this.speed = ghostChaseSpeeds[0];
		this.mode = mode;
		this.pickNextDir();
		this.dotCount = 0;
		this.jailTime = 0;
		this.voiceLine;
	}

	update = () => {
		if (this.mode !== "jail") {
			this.move();
			this.detect();
		} else {
			this.jail();
		}
	};

	move = () => {
		this.offset.x += this.dir.x * this.speed;
		this.offset.y += this.dir.y * this.speed;

		if (this.offset.x > this.maxOffset) {
			this.offset.x = -this.maxOffset;
			this.pos.x++;
		} else if (this.offset.x < -this.maxOffset) {
			this.offset.x = this.maxOffset;
			this.pos.x--;
		}

		if (this.offset.y > this.maxOffset) {
			this.offset.y = -this.maxOffset;
			this.pos.y++;
		} else if (this.offset.y < -this.maxOffset) {
			this.offset.y = this.maxOffset;
			this.pos.y--;
		}

		if (Math.abs(this.offset.x) < this.speed && Math.abs(this.offset.y) < this.speed) {
			this.offset.x = 0;
			this.offset.y = 0;
			this.dir = new Vec(this.nextDir.x, this.nextDir.y);
			this.pickNextDir();
		}

		//loop around
		if (this.pos.equals(new Vec(-1, 17))) {
			this.pos = new Vec(27, 17);
			this.offset.x = this.maxOffset;
		}

		if (this.pos.equals(new Vec(28, 17))) {
			this.pos = new Vec(0, 17);
			this.offset.x = -this.maxOffset;
		}
	};

	pickNextDir = () => {
		this.pickTarget();
		const next = new Vec(this.pos.x + this.dir.x, this.pos.y + this.dir.y);
		let paths = [];
		paths.push(new Vec(next.x, next.y - 1));
		paths.push(new Vec(next.x - 1, next.y));
		paths.push(new Vec(next.x, next.y + 1));
		paths.push(new Vec(next.x + 1, next.y));

		//remove invalid paths
		for (let i = 0; i < paths.length; i++) {
			const path = paths[i];
			if (board[path.y][path.x] === 1 || path.equals(this.pos)) {
				paths.splice(i, 1);
				i--;
			}
			const invisBarriers = [new Vec(-1, 16), new Vec(-1, 18), new Vec(28, 16), new Vec(28, 18)];
			for (const b of invisBarriers) {
				if (b.equals(path)) {
					paths.splice(i, 1);
					i--;
				}
			}
		}

		if (this.target) {
			paths.sort((a, b) => {
				return a.distance(this.target) - b.distance(this.target);
			});
		}

		if (this.mode == "frightened") {
			const index = Math.floor(Math.random() * paths.length);
			this.nextDir = new Vec(paths[index].x - next.x, paths[index].y - next.y);
		} else {
			this.nextDir = new Vec(paths[0].x - next.x, paths[0].y - next.y);
		}
	};

	detect = () => {
		if (
			controllable &&
			(this.pos.equals(p.pos) ||
				(this.pos.y === p.pos.y && Math.abs(this.pos.x * ts + this.offset.x - (p.pos.x * ts + p.offset.x)) < 8) ||
				(this.pos.x === p.pos.x && Math.abs(this.pos.y * ts + this.offset.y - (p.pos.y * ts + p.offset.y)) < 8))
		) {
			if (this.mode === "frightened") {
				controllable = false;
				setTimeout(() => {
					controllable = true;
				}, 350);
				let killedTotal = 0;
				ghosts.forEach((g) => {
					if (g.mode === "shame") {
						killedTotal++;
					}
				});
				score += 200 * Math.pow(2, killedTotal);

				this.mode = "shame";
				let index = 0;
				if (level > 0 && level < 4) {
					index = 1;
				} else if (level > 3) {
					index = 2;
				}
				this.speed = ghostChaseSpeeds[index];
			} else if (this.mode !== "shame") {
				p.death();
			}
		}
		if (this.mode === "shame" && this.pos.equals(new Vec(13, 14)) && Math.abs(this.offset.x) < this.speed) {
			if (this === ghosts[0] || this === ghosts[1]) {
				this.jailTime = 48;
			} else {
				this.jailTime = 73;
			}
			this.speed = 0;
			this.returnHome();
		}
		if (this.speed === 0 && this.mode === "shame") {
			this.returnHome();
		}
	};

	reverse = () => {
		this.nextDir.x = -this.dir.x;
		this.nextDir.y = -this.dir.y;
	};

	drawVoiceLine = () => {
		const lines = this.voiceLine.split("\n");
		let lineWidths = lines.slice();
		lineWidths.sort((a, b) => {
			return context.measureText(b).width - context.measureText(a).width;
		});
		const x = this.pos.x * ts + this.offset.x;
		const y = this.pos.y * ts + this.offset.y;
		context.textAlign = "center";
		context.font = "12px 'Press Start 2P'";
		const width = Math.floor(context.measureText(lineWidths[0]).width) + 10;
		const hWidth = Math.floor(width / 2);
		const height = lines.length * 14;
		context.fillStyle = "white";
		context.globalAlpha = 0.7;
		context.beginPath();
		context.moveTo(x - 16 + hWidth, y - 12 - height);
		context.lineTo(x - 16 - hWidth, y - 12 - height);
		context.lineTo(x - 10 - hWidth, y - 8);
		context.lineTo(x - 6, y - 8);
		context.lineTo(x + 3, y);
		context.lineTo(x + 1, y - 8);
		context.lineTo(x - 10 + hWidth, y - 8);
		context.closePath();
		context.fill();
		context.globalAlpha = 0.9;
		context.fillStyle = "black";
		for (let i = 0; i < lines.length; i++) {
			context.fillText(lines[i], x - 12, y - 10 - (lines.length - i - 1) * 14);
		}
		context.globalAlpha = 1;
	};

	pickTarget() {}
	draw() {}
	jail() {}
	returnHome() {}
}

class Red extends Ghost {
	pickTarget() {
		if (this.mode === "chase") {
			this.target = new Vec(p.pos.x, p.pos.y);
		} else if (this.mode === "scatter") {
			let ghostsInJail = false;
			ghosts.forEach((g) => {
				if (g.mode === "jail") {
					ghostsInJail = true;
				}
			});
			if (dotCount <= 20 && !ghostsInJail) {
				this.target = new Vec(p.pos.x, p.pos.y);
			} else {
				this.target = new Vec(25, 0);
			}
		} else if (this.mode === "shame") {
			this.target = new Vec(13, 14);
		}
	}

	draw() {
		context.save();
		context.shadowColor = "rgba(0, 0, 0, 0.8)";
		context.shadowOffsetX = -1;
		context.shadowOffsetY = 1;
		context.shadowBlur = 8;
		if (this.mode === "frightened") {
			if (frightenedTimer > 90 || Math.floor(frightenedTimer / 10) % 2 === 0) {
				context.drawImage(frightenedImage, 0, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			} else {
				context.drawImage(frightenedImage, 24, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			}
		} else if (this.mode === "shame") {
			context.globalAlpha = 0.2;
			context.drawImage(frightenedImage, 0, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
		} else {
			if (this.dir.x === 1) {
				context.drawImage(redImage, 0, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			} else if (this.dir.x === -1) {
				context.drawImage(redImage, 24, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			} else if (this.dir.y === 1) {
				context.drawImage(redImage, 48, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			} else if (this.dir.y === -1) {
				context.drawImage(redImage, 72, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			}
		}
		context.restore();
	}

	updateSpeed() {
		let index = 0;
		if (level > 0 && level < 4) {
			index = 1;
		} else if (level > 3) {
			index = 2;
		}
		if (dotCount <= 10) {
			this.speed = playerSpeeds[index + 1];
		} else if (dotCount <= 20) {
			this.speed = playerSpeeds[index];
		}
	}

	jail() {
		this.pos = new Vec(13, 17);
		this.offset = new Vec(7, -this.jailTime);
		this.jailTime++;
		if (this.jailTime === 48) {
			this.mode = "scatter";
			this.mode = getMode();
			this.pos = new Vec(13, 14);
			this.dir = new Vec(-1, 0);
			this.nextDir = new Vec(-1, 0);
			this.offset = new Vec(7, 0);
			this.jailTime = 0;
			let index = 0;
			if (level > 0 && level < 4) {
				index = 1;
			} else if (level > 3) {
				index = 2;
			}
			this.speed = ghostChaseSpeeds[index];
			this.updateSpeed();
		}
	}

	returnHome() {
		this.pos = new Vec(13, 17);
		this.offset = new Vec(7, -this.jailTime);
		this.jailTime--;
		if (this.jailTime === 0) {
			this.mode = "jail";
		}
	}
}

class Pink extends Ghost {
	pickTarget() {
		if (this.mode === "chase") {
			this.target = new Vec(p.pos.x + 4 * p.dir.x, p.pos.y + 4 * p.dir.y);
		} else if (this.mode === "scatter") {
			this.target = new Vec(2, 0);
		} else if (this.mode === "shame") {
			this.target = new Vec(13, 14);
		}
	}

	draw() {
		context.save();
		context.shadowColor = "rgba(0, 0, 0, 0.8)";
		context.shadowOffsetX = -1;
		context.shadowOffsetY = 1;
		context.shadowBlur = 8;
		if (this.mode === "frightened") {
			if (frightenedTimer > 90 || Math.floor(frightenedTimer / 10) % 2 === 0) {
				context.drawImage(frightenedImage, 0, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			} else {
				context.drawImage(frightenedImage, 24, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			}
		} else if (this.mode === "shame") {
			context.globalAlpha = 0.2;
			context.drawImage(frightenedImage, 0, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
		} else {
			if (this.dir.x === 1) {
				context.drawImage(pinkImage, 0, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			} else if (this.dir.x === -1) {
				context.drawImage(pinkImage, 24, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			} else if (this.dir.y === 1) {
				context.drawImage(pinkImage, 48, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			} else if (this.dir.y === -1) {
				context.drawImage(pinkImage, 72, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			}
		}
		context.restore();
	}

	jail() {
		this.pos = new Vec(13, 17);
		this.offset = new Vec(7, -this.jailTime);
		this.jailTime++;
		if (this.jailTime === 48) {
			this.mode = "scatter";
			this.mode = getMode();
			this.pos = new Vec(13, 14);
			this.dir = new Vec(-1, 0);
			this.nextDir = new Vec(-1, 0);
			this.offset = new Vec(7, 0);
			this.jailTime = 0;
			let index = 0;
			if (level > 0 && level < 4) {
				index = 1;
			} else if (level > 3) {
				index = 2;
			}
			this.speed = ghostChaseSpeeds[index];
		}
	}

	returnHome() {
		this.pos = new Vec(13, 17);
		this.offset = new Vec(7, -this.jailTime);
		this.jailTime--;
		if (this.jailTime === 0) {
			this.mode = "jail";
		}
	}
}

class Blue extends Ghost {
	pickTarget() {
		if (this.mode === "chase") {
			const pLoc = new Vec(p.pos.x + 2 * p.dir.x, p.pos.y + 2 * p.dir.y);
			const rLoc = ghosts[0].pos;
			this.target = new Vec(rLoc.x + 2 * (pLoc.x - rLoc.x), rLoc.y + 2 * (pLoc.y - rLoc.y));
		} else if (this.mode === "scatter") {
			this.target = new Vec(27, 35);
		} else if (this.mode === "shame") {
			this.target = new Vec(13, 14);
		}
	}

	draw() {
		context.save();
		context.shadowColor = "rgba(0, 0, 0, 0.8)";
		context.shadowOffsetX = -1;
		context.shadowOffsetY = 1;
		context.shadowBlur = 8;
		if (this.mode === "frightened") {
			if (frightenedTimer > 90 || Math.floor(frightenedTimer / 10) % 2 === 0) {
				context.drawImage(frightenedImage, 0, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			} else {
				context.drawImage(frightenedImage, 24, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			}
		} else if (this.mode === "shame") {
			context.globalAlpha = 0.2;
			context.drawImage(frightenedImage, 0, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
		} else {
			if (this.dir.x === 1) {
				context.drawImage(blueImage, 0, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			} else if (this.dir.x === -1) {
				context.drawImage(blueImage, 24, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			} else if (this.dir.y === 1) {
				context.drawImage(blueImage, 48, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			} else if (this.dir.y === -1) {
				context.drawImage(blueImage, 72, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			}
		}
		context.restore();
	}

	jail() {
		this.pos = new Vec(12, 17);
		this.offset = new Vec(-3, 0);
		if (ghosts[1].mode !== "jail") {
			if (this.dotCount >= 30 || level > 1 || p.dotTimer > 240) {
				this.jailTime++;
				if (this.jailTime < 26) {
					this.offset = new Vec(-3 + this.jailTime, 0);
				} else if (this.jailTime < 73) {
					this.offset = new Vec(22, 22 - this.jailTime);
				} else {
					this.mode = "scatter";
					this.mode = getMode();
					this.pos = new Vec(13, 14);
					this.dir = new Vec(-1, 0);
					this.nextDir = new Vec(-1, 0);
					this.offset = new Vec(7, 0);
					this.jailTime = 0;
					let index = 0;
					if (level > 0 && level < 4) {
						index = 1;
					} else if (level > 3) {
						index = 2;
					}
					this.speed = ghostChaseSpeeds[index];
					p.dotTimer = 0;
				}
			}
		}
	}

	returnHome() {
		this.pos = new Vec(12, 17);
		if (this.jailTime < 26) {
			this.offset = new Vec(-3 + this.jailTime, 0);
		} else if (this.jailTime < 73) {
			this.offset = new Vec(22, 22 - this.jailTime);
		}
		this.jailTime--;
		if (this.jailTime === 0) {
			this.mode = "jail";
		}
	}
}

class Orange extends Ghost {
	pickTarget() {
		if (this.pos.distance(p.pos) < 8 || this.mode === "scatter") {
			this.target = new Vec(0, 35);
		} else if (this.mode === "scatter") {
			this.target = new Vec(p.pos.x, p.pos.y);
		} else if (this.mode === "shame") {
			this.target = new Vec(13, 14);
		}
	}

	draw() {
		context.save();
		context.shadowColor = "rgba(0, 0, 0, 0.8)";
		context.shadowOffsetX = -1;
		context.shadowOffsetY = 1;
		context.shadowBlur = 8;
		if (this.mode === "frightened") {
			if (frightenedTimer > 90 || Math.floor(frightenedTimer / 10) % 2 === 0) {
				context.drawImage(frightenedImage, 0, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			} else {
				context.drawImage(frightenedImage, 24, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			}
		} else if (this.mode === "shame") {
			context.globalAlpha = 0.2;
			context.drawImage(frightenedImage, 0, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
		} else {
			if (this.dir.x === 1) {
				context.drawImage(orangeImage, 0, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			} else if (this.dir.x === -1) {
				context.drawImage(orangeImage, 24, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			} else if (this.dir.y === 1) {
				context.drawImage(orangeImage, 48, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			} else if (this.dir.y === -1) {
				context.drawImage(orangeImage, 72, 0, 24, 24, this.pos.x * ts + this.offset.x - 4, this.pos.y * ts + this.offset.y - 4, 24, 24);
			}
		}
		context.restore();
	}

	jail() {
		this.pos = new Vec(15, 17);
		this.offset = new Vec(3, 0);
		if (ghosts[2].mode !== "jail") {
			if (this.dotCount >= 60 || level > 1 || p.dotTimer > 240) {
				this.jailTime++;
				if (this.jailTime < 26) {
					this.offset = new Vec(3 - this.jailTime, 0);
				} else if (this.jailTime < 73) {
					this.offset = new Vec(-22, 22 - this.jailTime);
				} else {
					this.mode = "scatter";
					this.mode = getMode();
					this.pos = new Vec(13, 14);
					this.dir = new Vec(-1, 0);
					this.nextDir = new Vec(-1, 0);
					this.offset = new Vec(7, 0);
					this.jailTime = 0;
					let index = 0;
					if (level > 0 && level < 4) {
						index = 1;
					} else if (level > 3) {
						index = 2;
					}
					this.speed = ghostChaseSpeeds[index];
					p.dotTimer = 0;
				}
			}
		}
	}

	returnHome() {
		this.pos = new Vec(15, 17);
		if (this.jailTime < 26) {
			this.offset = new Vec(3 - this.jailTime, 0);
		} else if (this.jailTime < 73) {
			this.offset = new Vec(-22, 22 - this.jailTime);
		}
		this.jailTime--;
		if (this.jailTime === 0) {
			this.mode = "jail";
		}
	}
}
