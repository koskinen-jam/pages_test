const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'A', 'B', 'C', 'D', 'E', 'F'];

var clockParent = document.querySelector('div#showy');

var clock = new Clock(digits.slice(0, 10));

clockParent.appendChild(clock.element);

function ButtonHandler(buttons) {
	this.buttons = [];
	this.active = null;
	
	for (b of buttons) {
		if (b.classList.contains('active')) {
			this.active = b;
		}
		this.buttons.push(b);
	}

	this.setActive = function(button) {
		button.classList.remove('inactive');
		button.classList.add('active');
	}

	this.setInactive = function(button) {
		button.classList.remove('active');
		button.classList.add('inactive');
	}

	this.addListeners = function() {
		const handler = this;

		for (b of this.buttons) {
			b.addEventListener(
				'click',
				(evt) => {
					this.setInactive(this.active);
					this.setActive(evt.currentTarget);
					this.active = evt.currentTarget;
				}
			)
		}
	}

	this.addListeners();
}

function replaceClock(digits) {
	clockParent.removeChild(clock.element);

	clock = new Clock(digits);

	if (digits.length < 3) {
		clock.element.classList.add('column');
	}

	clockParent.appendChild(clock.element);
}

const clockSpec = {
	setBin: 2,
	setDec: 10,
	setHex: 16
};

let buttons = [];

for (const buttonName in clockSpec) {
	let numDigits = clockSpec[buttonName];
	let button = document.querySelector(`button#${buttonName}`);
	buttons.push(button);
	button.addEventListener(
		'click',
		() => {
			replaceClock(digits.slice(0, numDigits));
		}
	);
}

new ButtonHandler(buttons);
