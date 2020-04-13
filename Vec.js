class Vec {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	equals = (v) => {
		return this.x === v.x && this.y === v.y;
	};

	distance = (v) => {
		return Math.sqrt((v.x - this.x) * (v.x - this.x) + (v.y - this.y) * (v.y - this.y));
	};
}
