// Create a number in given base. The numbers value always stays in [min, max] inclusive.

function MinMaxNumber(base, value, min, max) {
	this.base = base;
	this.min = min;
	this.max = max;
	// Clamp value between min and max
	this.value = value < min
		? min
		: value > max
			? max
			: value;

	// Return number of digits required to display maximum value
	this.digitCount = function() {
		let c = 1;
		let n = 1;

		while (this.max / n > 1) {
			n *= this.base;

			if (this.max / n < 1) {
				break;
			}
			c += 1;
		}

		return c;
	}

	// Return the digit of n at power'th power in this numbers base
	this.digit = function(n, power) {
		return Math.floor(n / Math.pow(this.base, power)) % this.base;
	}

	// Return the digit of this number at power'th power in this numbers base
	this.digitAt = function(power) {
		return this.digit(this.value, power);
	}

	// Return this number + n clamped to min-max range	
	this.add = function(n) {
		return this.clamp(this.value + n);
	}

	// Add n to this numbers value
	this.increment = function() {
		this.value = this.add(1);
	}

	// Return true if digit at power changed when incrementing
	this.digitDidChange = function(power) {
		return this.digitAt(power) !== this.digit(this.add(-1), power);
	}

	// Return true if number wrapped around on last increment
	this.didWrap = function() {
		return this.add(-1) === this.max;
	}

	// Clamp n between inside this numbers min-max range
	this.clamp = function(n) {
		return this.min + this.mod(n - this.min, this.max - this.min + 1);
	}

	// Return a modulo n
	this.mod = function(a, n) {
		return ((a % n) + n) % n;
	}

	// Return the sequence of digits at given power of the base number.
	// Start and end define the range of numbers as steps with 0 being the current value,
	// -n being n steps backwards and +n n steps forward,
	// e.g. start=-2, end=2 contains two previous digits, current digit and next two digits.

	this.digitsAt = function(power, start, end) {
		let ret = [];

		if (start > end) {
			throw "Cannot have start greater than end D:<";
		}

		ret.push(this.digitAt(power));

		let base = Math.pow(this.base, power);

		// Generate digits backwards from current value.

		if (start < 0) {
			let v = this.value;

			for (let i = -1; i >= start; i--) {
				v -= base;

				let d = this.digit(v, power);

				// If we're at or above minimum, add digit to start of result

				if (v >= this.min) {
					ret.unshift(d);
					continue;
				}

				// If we go past minimum, add the digit of the minimum value if it is the same
				// as our calculated digit as extra.
				
				let dMin = this.digit(this.min, power);
				if (dMin === d) {
					ret.unshift(dMin);
					i--;
					if (i < start) {
						break;
					}
				}

				// Wrap around to maximum value, add digit from it

				ret.unshift(this.digit(this.max, power));
				v = this.max;
			}
		}

		// Generate digits forwards from current value.

		if (end > 0) {
			let v = this.value;

			for (let i = 1; i <= end; i++) {
				v += base;

				let d = this.digit(v, power);

				// If we're at or below maximum, add digit to end of result

				if (v <= this.max) {
					ret.push(d);
					continue;
				}

				// If we go past maximum and our calculated digit is the same as in the maximum
				// value, add it as extra.

				let dMax = this.digit(this.max, power);
				if (dMax === d) {
					ret.push(d);
					i++;
					if (i > end) {
						break;
					}
				}

				// Wrap around to minimum value, add digit from it

				ret.push(this.digit(this.min, power));
				v = this.min;
			}
		}

		// Return the desired slice of the result

		let resultLen = end - start + 1;

		if (start < 0) {
			if (end < 0) {
				return ret.slice(0, resultLen);
			}
			return ret;
		}

		if (start === 0) {
			return ret;
		}

		return ret.slice(start);
	}
}

// Display for showing the current, previous and next values of a digit of given MinMaxNumber
// at the power pos of the base number.

var displayId = 0;

function DigitDisplay(digits, number, pos) {
	this.id = displayId++;

	this.number = number; // The MinMaxNumber to display the digit of

	this.digits = digits; // Array of digits used for displaying the numbers (e.g. [0, 1] for base 2)
	this.visible = 4; // Not exactly "visible", but used for determining the range of moving elements
	this.pos = pos; // Power of base number to display, e.g. 0 for ones, 1 for tens, etc in base 10.
	
	this.element = null; // Containing div
	this.container = null; // Visible area div
	this.plates = []; // Moving elements with numbers

	// Create container elements for this scroller	
	this.createContainers = function() {
		// Containing element
		this.element = document.createElement('div');
		this.element.classList.add('digitDisplay');
	
		// Area where number plates are visible
		this.container = document.createElement('div');
		this.container.classList.add('digitDisplayVisibleArea');
		this.element.appendChild(this.container);
	
		// Gradient fade to containing element background color
		// on top of visible area
		let topF = document.createElement('div');
		topF.classList.add('visibleAreaTopFade');
		this.container.appendChild(topF);
	
		// Gradient fade to containing element background color
		// at bottom of visible area
		let botF = document.createElement('div');
		botF.classList.add('visibleAreaBottomFade');
		this.container.appendChild(botF);
	}

	// Create elements for the plates containing the different digits of the display
	// and set their initial positions

	this.createPlates = function() {
		let visibleNumbers = this.number.digitsAt(this.pos, -2, this.visible -2);

		for (let i = 0; i < this.visible + 1; i++) {
			let plate = document.createElement('div');
			plate.classList.add('valuePlate');
			plate.innerText = this.digits[visibleNumbers[i]];
			this.container.appendChild(plate);
			this.plates.push(plate);
			plate.classList.add(`pos${i}`);
		}
	}

	// If the number we're displaying changed, cycle positions forward and add the
	// next number in the sequence to the queue.

	this.update = function() {
		if (! this.number.didWrap() && ! this.number.digitDidChange(this.pos)) {
			return;
		}
		for (let i = 0; i < this.visible; i++) {
			this.plates[i].classList.remove(`pos${i}`);
			this.plates[i + 1].classList.add(`pos${i}`);
		}
		let last = this.plates.shift();
		last.innerText = this.digits[this.number.digitsAt(this.pos, 2, 2)[0]];
		this.plates.push(last);
	}

	// Display initialization

	this.createContainers();
	this.createPlates();
}

// Return a display with enough digits to show the maximum number. Initial value is start.
// After maximum value, loops around to minimum value.

function NumberDisplay(digits, start, min, max, labelText) {
	this.element = document.createElement('div');
	this.element.classList.add('numberDisplay');
	this.base = digits.length;

	this.number = new MinMaxNumber(this.base, start, min, max);
	
	this.displays = [];

	if (labelText !== undefined) {
		let label = document.createElement('div');
		label.classList.add('displayLabel');
		let labelContent = document.createElement('div');
		labelContent.classList.add('displayLabelContent');
		labelContent.innerText = labelText;
		label.appendChild(labelContent);
		this.element.appendChild(label);
	}

	for (p = this.number.digitCount() - 1; p >= 0; p--) {
		let s = new DigitDisplay(
			digits,
			this.number,
			p
		);
		this.element.appendChild(s.element);
		this.displays.unshift(s);
	}

	// Add 1 to the current number and update the digits where needed.

	this.next = function() {
		this.number.increment();

		for (d of this.displays) {
			d.update();
		}
	}
}

// 24 hour clock using given array of letters to display the current time.

function Clock(digits) {
	this.element = document.createElement('div');
	this.element.classList.add('clock');

	let t = new Date();

	let hours = t.getHours();
	let minutes = t.getMinutes();
	let seconds = t.getSeconds();

	let millisInHour = 1000 * 60 * 60;
	let millisInMinute = 1000 * 60;
	let millisInSecond = 1000;

	this.hours = new NumberDisplay(digits, hours, 0, 23, 'HOURS');
	this.minutes = new NumberDisplay(digits, minutes, 0, 59, 'MINUTES');
	this.seconds = new NumberDisplay(digits, seconds, 0, 59, 'SECONDS');

	for (d of [this.hours, this.minutes, this.seconds]) {
		this.element.appendChild(d.element);
	}

	// Wait until minutes roll over to change hour the first time,
	// then repeat every hour.

	setTimeout(
		() => {
			this.hours.next();
			setInterval(
				() => {
					this.hours.next();
				},
				millisInHour
			);
		},
		(60 - minutes) * millisInMinute
	);

	// Wait until seconds roll over to change minute the first time,
	// then repeat every minute.

	setTimeout(
		() => {
			this.minutes.next();
			setInterval(
				() => {
					this.minutes.next();
				},
				millisInMinute
			);
		},
		(60 - seconds) * millisInSecond
	);

	// Advance seconds every second

	setInterval(
		() => {
			this.seconds.next();
		},
		millisInSecond
	);
}