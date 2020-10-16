const Resource = require('./resource.js');

function AlbertSchoolController() {
	this.prevDirection = 0;
	this.prevDirectionFinal = 0;
	this.directionCount = 0;
	this.directionCountFinal = 0;
	this.positionCount = 0;
	this.positionCountFinal = 0;
	this.isBackward = false;
}

AlbertSchoolController.prototype.PI = 3.14159265;
AlbertSchoolController.prototype.PI2 = 6.2831853;
AlbertSchoolController.prototype.GAIN_ANGLE = 30;
AlbertSchoolController.prototype.GAIN_ANGLE_FINE = 30;
AlbertSchoolController.prototype.GAIN_POSITION_FINE = 30;
AlbertSchoolController.prototype.STRAIGHT_SPEED = 30;
AlbertSchoolController.prototype.MAX_BASE_SPEED = 30;
AlbertSchoolController.prototype.GAIN_BASE_SPEED = 1.5;
AlbertSchoolController.prototype.GAIN_POSITION = 52.5;
AlbertSchoolController.prototype.POSITION_TOLERANCE_FINE = 3;
AlbertSchoolController.prototype.POSITION_TOLERANCE_FINE_LARGE = 5;
AlbertSchoolController.prototype.POSITION_TOLERANCE_ROUGH = 5;
AlbertSchoolController.prototype.POSITION_TOLERANCE_ROUGH_LARGE = 10;
AlbertSchoolController.prototype.ORIENTATION_TOLERANCE_FINAL = 0.087;
AlbertSchoolController.prototype.ORIENTATION_TOLERANCE_FINAL_LARGE = 0.122;
AlbertSchoolController.prototype.ORIENTATION_TOLERANCE_FINAL_LARGE_LARGE = 0.262;
AlbertSchoolController.prototype.ORIENTATION_TOLERANCE_ROUGH = 0.122;
AlbertSchoolController.prototype.ORIENTATION_TOLERANCE_ROUGH_LARGE = 0.262;
AlbertSchoolController.prototype.ORIENTATION_TOLERANCE_ROUGH_LARGE_LARGE = 0.524;
AlbertSchoolController.prototype.MINIMUM_WHEEL_SPEED = 18;
AlbertSchoolController.prototype.MINIMUM_WHEEL_SPEED_FINE = 15;

AlbertSchoolController.prototype.clear = function() {
	this.prevDirection = 0;
	this.prevDirectionFinal = 0;
	this.directionCount = 0;
	this.directionCountFinal = 0;
	this.positionCount = 0;
	this.positionCountFinal = 0;
};

AlbertSchoolController.prototype.setBackward = function(backward) {
	this.isBackward = backward;
};

AlbertSchoolController.prototype.controlAngleInitial = function(wheels, currentRadian, targetRadian) {
	if(this.isBackward) {
		currentRadian += this.PI;
	}
	var diff = this.validateRadian(targetRadian - currentRadian);
	var mag = Math.abs(diff);
	if (mag < this.ORIENTATION_TOLERANCE_ROUGH) return true;
	
	var direction = diff > 0 ? 1 : -1;
	if(mag < this.ORIENTATION_TOLERANCE_ROUGH_LARGE && direction * this.prevDirection < 0) return true;
	this.prevDirection = direction;
	
	var value = 0;
	if(diff > 0) {
		value = Math.log(1 + mag) * this.GAIN_ANGLE;
		if(value < this.MINIMUM_WHEEL_SPEED) value = this.MINIMUM_WHEEL_SPEED;
	} else {
		value = -Math.log(1 + mag) * this.GAIN_ANGLE;
		if(value > -this.MINIMUM_WHEEL_SPEED) value = -this.MINIMUM_WHEEL_SPEED;
	}
	value = parseInt(value);
	wheels.left = -value;
	wheels.right = value;
	return false;
};

AlbertSchoolController.prototype.controlAngleFinal = function(wheels, currentRadian, targetRadian) {
	var diff = this.validateRadian(targetRadian - currentRadian);
	var mag = Math.abs(diff);
	if(mag < this.ORIENTATION_TOLERANCE_FINAL) return true;

	var direction = diff > 0 ? 1 : -1;
	if(mag < this.ORIENTATION_TOLERANCE_FINAL_LARGE && direction * this.prevDirectionFinal < 0) return true;
	if(mag < this.ORIENTATION_TOLERANCE_FINAL_LARGE_LARGE && direction * this.prevDirectionFinal < 0) {
		if(++this.directionCountFinal > 3) return true;
	}
	this.prevDirectionFinal = direction;
	
	var value = 0;
	if(diff > 0) {
		value = Math.log(1 + mag) * this.GAIN_ANGLE_FINE;
		if(value < this.MINIMUM_WHEEL_SPEED) value = this.MINIMUM_WHEEL_SPEED;
	} else {
		value = -Math.log(1 + mag) * this.GAIN_ANGLE_FINE;
		if(value > -this.MINIMUM_WHEEL_SPEED) value = -this.MINIMUM_WHEEL_SPEED;
	}
	value = parseInt(value);
	wheels.left = -value;
	wheels.right = value;
	return false;
};

AlbertSchoolController.prototype.controlPositionFine = function(wheels, currentX, currentY, currentRadian, targetX, targetY) {
	var targetRadian = Math.atan2(targetY - currentY, targetX - currentX);
	if(this.isBackward) {
		currentRadian += this.PI;
	}
	var diff = this.validateRadian(targetRadian - currentRadian);
	var mag = Math.abs(diff);
	var ex = targetX - currentX;
	var ey = targetY - currentY;
	var dist = Math.sqrt(ex * ex + ey * ey);
	if(dist < this.POSITION_TOLERANCE_FINE) return true;
	if(dist < this.POSITION_TOLERANCE_FINE_LARGE) {
		if (++this.positionCountFinal > 5) {
			this.positionCountFinal = 0;
			return true;
		}
	}
	var value = 0;
	if (diff > 0) value = Math.log(1 + mag) * this.GAIN_POSITION_FINE;
	else value = -Math.log(1 + mag) * this.GAIN_POSITION_FINE;
	if(this.isBackward) {
		value = -value;
	}
	value = parseInt(value);
	wheels.left = this.MINIMUM_WHEEL_SPEED_FINE - value;
	wheels.right = this.MINIMUM_WHEEL_SPEED_FINE + value;
	if(this.isBackward) {
		wheels.left = -wheels.left;
		wheels.right = -wheels.right;
	}
	return false;
};

AlbertSchoolController.prototype.controlPosition = function(wheels, currentX, currentY, currentRadian, targetX, targetY) {
	var targetRadian = Math.atan2(targetY - currentY, targetX - currentX);
	if(this.isBackward) {
		currentRadian += this.PI;
	}
	var diff = this.validateRadian(targetRadian - currentRadian);
	var mag = Math.abs(diff);
	var ex = targetX - currentX;
	var ey = targetY - currentY;
	var dist = Math.sqrt(ex * ex + ey * ey);
	if(dist < this.POSITION_TOLERANCE_ROUGH) return true;
	if(dist < this.POSITION_TOLERANCE_ROUGH_LARGE) {
		if(++this.positionCount > 10) {
			this.positionCount = 0;
			return true;
		}
	} else {
		this.positionCount = 0;
	}
	if(mag < 0.01) {
		wheels.left = this.STRAIGHT_SPEED;
		wheels.right = this.STRAIGHT_SPEED;
	} else {
		var base = (this.MINIMUM_WHEEL_SPEED + 0.5 / mag) * this.GAIN_BASE_SPEED;
		if(base > this.MAX_BASE_SPEED) base = this.MAX_BASE_SPEED;
		
		var value = 0;
		if(diff > 0) value = Math.log(1 + mag) * this.GAIN_POSITION;
		else value = -Math.log(1 + mag) * this.GAIN_POSITION;
		if(this.isBackward) {
			value = -value;
		}
		base = parseInt(base);
		value = parseInt(value);
		wheels.left = base - value;
		wheels.right = base + value;
	}
	if(this.isBackward) {
		wheels.left = -wheels.left;
		wheels.right = -wheels.right;
	}
	return false;
};

AlbertSchoolController.prototype.validateRadian = function(radian) {
	if(radian > this.PI) return radian - this.PI2;
	else if(radian < -this.PI) return radian + this.PI2;
	return radian;
};

AlbertSchoolController.prototype.toRadian = function(degree) {
	return degree * 3.14159265 / 180.0;
};

function AlbertSchoolNavigator() {
	this.controller = new AlbertSchoolController();
	this.mode = 0;
	this.state = 0;
	this.initialized = false;
	this.boardWidth = 0;
	this.boardHeight = 0;
	this.currentX = -1;
	this.currentY = -1;
	this.currentTheta = -200;
	this.targetX = -1;
	this.targetY = -1;
	this.targetTheta = -200;
	this.wheels = { completed: false, left: 0, right: 0 };
}

AlbertSchoolNavigator.prototype.clear = function() {
	this.mode = 0;
	this.state = 0;
	this.initialized = false;
	this.currentX = -1;
	this.currentY = -1;
	this.currentTheta = -200;
	this.targetX = -1;
	this.targetY = -1;
	this.targetTheta = -200;
	this.wheels.completed = false;
	this.wheels.left = 0;
	this.wheels.right = 0;
	this.controller.clear();
};

AlbertSchoolNavigator.prototype.getBoardWidth = function() {
	return this.boardWidth;
};

AlbertSchoolNavigator.prototype.getBoardHeight = function() {
	return this.boardHeight;
};

AlbertSchoolNavigator.prototype.setBoardSize = function(width, height) {
	this.boardWidth = width;
	this.boardHeight = height;
};

AlbertSchoolNavigator.prototype.setBackward = function(backward) {
	this.controller.setBackward(backward);
};

AlbertSchoolNavigator.prototype.moveTo = function(x, y) {
	this.clear();
	this.targetX = x;
	this.targetY = y;
	this.state = 1;
	this.mode = 1;
};

AlbertSchoolNavigator.prototype.turnTo = function(deg) {
	this.clear();
	this.targetTheta = deg;
	this.state = 1;
	this.mode = 2;
};

AlbertSchoolNavigator.prototype.handleSensory = function(sensory) {
	if(this.mode == 1) {
		var x = sensory.positionX;
		var y = sensory.positionY;
		if(x >= 0) this.currentX = x;
		if(y >= 0) this.currentY = y;
		this.currentTheta = sensory.orientation;
		switch(this.state) {
			case 1: {
				if(this.initialized == false) {
					if(this.currentX < 0 || this.currentY < 0) {
						this.wheels.left = 20;
						this.wheels.right = -20;
					} else {
						this.initialized = true;
					}
				}
				if(this.initialized) {
					var currentRadian = this.controller.toRadian(this.currentTheta);
					var dx = this.targetX - this.currentX;
					var dy = this.targetY - this.currentY;
					var targetRadian = Math.atan2(dy, dx);
					if(this.controller.controlAngleInitial(this.wheels, currentRadian, targetRadian)) {
						this.state = 2;
					}
				}
				break;
			}
			case 2: {
				var currentRadian = this.controller.toRadian(this.currentTheta);
				if(this.controller.controlPosition(this.wheels, this.currentX, this.currentY, currentRadian, this.targetX, this.targetY)) {
					this.state = 3;
				}
				break;
			}
			case 3: {
				var currentRadian = this.controller.toRadian(this.currentTheta);
				if(this.controller.controlPositionFine(this.wheels, this.currentX, this.currentY, currentRadian, this.targetX, this.targetY)) {
					this.clear();
					this.wheels.completed = true;
				}
				break;
			}
		}
	} else if(this.mode == 2) {
		this.currentTheta = sensory.orientation;
		switch(this.state) {
			case 1: {
				var currentRadian = this.controller.toRadian(this.currentTheta);
				var targetRadian = this.controller.toRadian(this.targetTheta);
				if(this.controller.controlAngleInitial(this.wheels, currentRadian, targetRadian)) {
					this.state = 2;
				}
				break;
			}
			case 2: {
				var currentRadian = this.controller.toRadian(this.currentTheta);
				var targetRadian = this.controller.toRadian(this.targetTheta);
				if(this.controller.controlAngleFinal(this.wheels, currentRadian, targetRadian)) {
					this.clear();
					this.wheels.completed = true;
				}
				break;
			}
		}
	}
	return this.wheels;
};

function AlbertSchool(index) {
	this.sensory = {
		map: 0,
		signalStrength: 0,
		leftProximity: 0,
		rightProximity: 0,
		accelerationX: 0,
		accelerationY: 0,
		accelerationZ: 0,
		positionX: -1,
		positionY: -1,
		orientation: -200,
		light: 0,
		temperature: 0,
		frontOid: -1,
		rearOid: -1,
		batteryState: 2,
		tilt: 0,
		handFound: false
	};
	this.motoring = {
		module: 'albertschool',
		index: index,
		map: 0xbe000000,
		leftWheel: 0,
		rightWheel: 0,
		buzzer: 0,
		leftEye: 0,
		rightEye: 0,
		note: 0,
		bodyLed: 0,
		frontLed: 0,
		boardWidth: 0,
		boardHeight: 0,
		motion: 0
	};
	this.blockId = 0;
	this.wheelId = 0;
	this.wheelTimer = undefined;
	this.navigationCallback = undefined;
	this.navigator = undefined;
	this.noteId = 0;
	this.noteTimer1 = undefined;
	this.noteTimer2 = undefined;
	this.tempo = 60;
	this.timeouts = [];
}

AlbertSchool.prototype.reset = function() {
	var motoring = this.motoring;
	motoring.map = 0x8efc0000;
	motoring.leftWheel = 0;
	motoring.rightWheel = 0;
	motoring.buzzer = 0;
	motoring.leftEye = 0;
	motoring.rightEye = 0;
	motoring.note = 0;
	motoring.bodyLed = 0;
	motoring.frontLed = 0;
	motoring.boardWidth = 0;
	motoring.boardHeight = 0;
	motoring.motion = 0;
	
	this.blockId = 0;
	this.wheelId = 0;
	this.wheelTimer = undefined;
	this.navigationCallback = undefined;
	this.navigator = undefined;
	this.noteId = 0;
	this.noteTimer1 = undefined;
	this.noteTimer2 = undefined;
	this.tempo = 60;
	
	this.__removeAllTimeouts();
};

AlbertSchool.prototype.__removeTimeout = function(id) {
	clearTimeout(id);
	var idx = this.timeouts.indexOf(id);
	if(idx >= 0) {
		this.timeouts.splice(idx, 1);
	}
};

AlbertSchool.prototype.__removeAllTimeouts = function() {
	var timeouts = this.timeouts;
	for(var i in timeouts) {
		clearTimeout(timeouts[i]);
	}
	this.timeouts = [];
};

AlbertSchool.prototype.clearMotoring = function() {
	this.motoring.map = 0xbe000000;
};

AlbertSchool.prototype.clearEvent = function() {
};

AlbertSchool.prototype.__issueWheelId = function() {
	this.wheelId = this.blockId = (this.blockId % 65535) + 1;
	return this.wheelId;
};

AlbertSchool.prototype.__cancelWheel = function() {
	this.wheelId = 0;
	if(this.wheelTimer !== undefined) {
		this.__removeTimeout(this.wheelTimer);
	}
	this.wheelTimer = undefined;
};

AlbertSchool.prototype.__getNavigator = function() {
	if(this.navigator == undefined) {
		this.navigator = new AlbertSchoolNavigator();
	}
	return this.navigator;
};

AlbertSchool.prototype.__cancelNavigation = function() {
	this.navigationCallback = undefined;
	if(this.navigator) {
		this.navigator.clear();
	}
};

AlbertSchool.prototype.__setLeftEye = function(color) {
	this.motoring.leftEye = color;
	this.motoring.map |= 0x00800000;
};

AlbertSchool.prototype.__setRightEye = function(color) {
	this.motoring.rightEye = color;
	this.motoring.map |= 0x00400000;
};

AlbertSchool.prototype.__setNote = function(note) {
	this.motoring.note = note;
	this.motoring.map |= 0x00200000;
};

AlbertSchool.prototype.__issueNoteId = function() {
	this.noteId = this.blockId = (this.blockId % 65535) + 1;
	return this.noteId;
};

AlbertSchool.prototype.__cancelNote = function() {
	this.noteId = 0;
	if(this.noteTimer1 !== undefined) {
		this.__removeTimeout(this.noteTimer1);
	}
	if(this.noteTimer2 !== undefined) {
		this.__removeTimeout(this.noteTimer2);
	}
	this.noteTimer1 = undefined;
	this.noteTimer2 = undefined;
};

AlbertSchool.prototype.__setBodyLed = function(value) {
	this.motoring.bodyLed = value;
	this.motoring.map |= 0x00100000;
};

AlbertSchool.prototype.__setFrontLed = function(value) {
	this.motoring.frontLed = value;
	this.motoring.map |= 0x00080000;
};

AlbertSchool.prototype.__setBoardSize = function(width, height) {
	this.motoring.boardWidth = width;
	this.motoring.boardHeight = height;
	this.motoring.map |= 0x00040000;
};

AlbertSchool.prototype.handleSensory = function() {
	if(this.navigationCallback) {
		if(this.navigator) {
			var result = this.navigator.handleSensory(this.sensory);
			this.motoring.leftWheel = result.left;
			this.motoring.rightWheel = result.right;
			if(result.completed) {
				var callback = this.navigationCallback;
				this.__cancelNavigation();
				if(callback) callback();
			}
		}
	}
};

AlbertSchool.prototype.__motion = function(type, leftVelocity, rightVelocity, secs, callback) {
	var self = this;
	var motoring = self.motoring;
	self.__cancelNavigation();
	self.__cancelWheel();
	
	secs = parseFloat(secs);
	if(secs && secs > 0) {
		var id = self.__issueWheelId();
		motoring.leftWheel = leftVelocity;
		motoring.rightWheel = rightVelocity;
		motoring.motion = type;
		self.wheelTimer = setTimeout(function() {
			if(self.wheelId == id) {
				motoring.leftWheel = 0;
				motoring.rightWheel = 0;
				motoring.motion = 0;
				self.__cancelWheel();
				callback();
			}
		}, secs * 1000);
		self.timeouts.push(self.wheelTimer);
	} else {
		motoring.leftWheel = 0;
		motoring.rightWheel = 0;
		motoring.motion = 0;
		callback();
	}
};

AlbertSchool.prototype.moveForward = function(callback) {
	this.__motion(1, 30, 30, 1, callback);
};

AlbertSchool.prototype.moveBackward = function(callback) {
	this.__motion(2, -30, -30, 1, callback);
};

AlbertSchool.prototype.turn = function(direction, callback) {
	if(direction == 'left') {
		this.__motion(3, -30, 30, 1, callback);
	} else {
		this.__motion(4, 30, -30, 1, callback);
	}
};

AlbertSchool.prototype.moveForwardSecs = function(secs, callback) {
	if(secs < 0) this.__motion(2, -30, -30, -secs, callback);
	else this.__motion(1, 30, 30, secs, callback);
};

AlbertSchool.prototype.moveBackwardSecs = function(secs, callback) {
	if(secs < 0) this.__motion(1, 30, 30, -secs, callback);
	else this.__motion(2, -30, -30, secs, callback);
};

AlbertSchool.prototype.turnSecs = function(direction, secs, callback) {
	if(direction == 'left') {
		if(secs < 0) this.__motion(4, 30, -30, -secs, callback);
		else this.__motion(3, -30, 30, secs, callback);
	} else {
		if(secs < 0) this.__motion(3, -30, 30, -secs, callback);
		else this.__motion(4, 30, -30, secs, callback);
	}
};

AlbertSchool.prototype.setWheels = function(leftVelocity, rightVelocity) {
	var motoring = this.motoring;
	this.__cancelNavigation();
	this.__cancelWheel();
	
	leftVelocity = parseFloat(leftVelocity);
	rightVelocity = parseFloat(rightVelocity);
	if(typeof leftVelocity == 'number') {
		motoring.leftWheel = leftVelocity;
	}
	if(typeof rightVelocity == 'number') {
		motoring.rightWheel = rightVelocity;
	}
	motoring.motion = 0;
};

AlbertSchool.prototype.changeWheels = function(leftVelocity, rightVelocity) {
	var motoring = this.motoring;
	this.__cancelNavigation();
	this.__cancelWheel();
	
	leftVelocity = parseFloat(leftVelocity);
	rightVelocity = parseFloat(rightVelocity);
	if(typeof leftVelocity == 'number') {
		motoring.leftWheel += leftVelocity;
	}
	if(typeof rightVelocity == 'number') {
		motoring.rightWheel += rightVelocity;
	}
	motoring.motion = 0;
};

AlbertSchool.prototype.setWheel = function(wheel, velocity) {
	var motoring = this.motoring;
	this.__cancelNavigation();
	this.__cancelWheel();
	
	velocity = parseFloat(velocity);
	if(typeof velocity == 'number') {
		if(wheel == 'left') {
			motoring.leftWheel = velocity;
		} else if(wheel == 'right') {
			motoring.rightWheel = velocity;
		} else {
			motoring.leftWheel = velocity;
			motoring.rightWheel = velocity;
		}
	}
	motoring.motion = 0;
};

AlbertSchool.prototype.changeWheel = function(wheel, velocity) {
	var motoring = this.motoring;
	this.__cancelNavigation();
	this.__cancelWheel();
	
	velocity = parseFloat(velocity);
	if(typeof velocity == 'number') {
		if(wheel == 'left') {
			motoring.leftWheel += velocity;
		} else if(wheel == 'right') {
			motoring.rightWheel += velocity;
		} else {
			motoring.leftWheel += velocity;
			motoring.rightWheel += velocity;
		}
	}
	motoring.motion = 0;
};

AlbertSchool.prototype.stop = function() {
	var motoring = this.motoring;
	this.__cancelNavigation();
	this.__cancelWheel();
	
	motoring.leftWheel = 0;
	motoring.rightWheel = 0;
	motoring.motion = 0;
};

AlbertSchool.prototype.setBoardSize = function(width, height) {
	width = parseInt(width);
	height = parseInt(height);
	if(width && height && width > 0 && height > 0) {
		var navi = this.__getNavigator();
		navi.setBoardSize(width, height);
		this.__setBoardSize(width, height);
	}
};

AlbertSchool.prototype.moveToOnBoard = function(toward, x, y, callback) {
	var motoring = this.motoring;
	this.__cancelNavigation();
	this.__cancelWheel();
	
	x = parseInt(x);
	y = parseInt(y);
	var navi = this.__getNavigator();
	if((typeof x == 'number') && (typeof y == 'number') && x >= 0 && x < navi.getBoardWidth() && y >= 0 && y < navi.getBoardHeight()) {
		motoring.motion = 0;
		navi.setBackward(toward == 'backward');
		navi.moveTo(x, y);
		this.navigationCallback = callback;
	}
};

AlbertSchool.prototype.setOrientationToOnBoard = function(degree, callback) {
	var motoring = this.motoring;
	this.__cancelNavigation();
	this.__cancelWheel();
	
	degree = parseInt(degree);
	if(typeof degree == 'number') {
		var navi = this.__getNavigator();
		motoring.motion = 0;
		navi.setBackward(false);
		navi.turnTo(degree);
		this.navigationCallback = callback;
	}
};

AlbertSchool.prototype.__COLORS = {
	'red': 4,
	'yellow': 6,
	'green': 2,
	'sky blue': 3,
	'blue': 1,
	'purple': 5,
	'white': 7
};

AlbertSchool.prototype.setEye = function(eye, color) {
	color = this.__COLORS[color];
	if(color && color > 0) {
		if(eye == 'left') {
			this.__setLeftEye(color);
		} else if(eye == 'right') {
			this.__setRightEye(color);
		} else {
			this.__setLeftEye(color);
			this.__setRightEye(color);
		}
	}
};

AlbertSchool.prototype.clearEye = function(eye) {
	if(eye == 'left') {
		this.__setLeftEye(0);
	} else if(eye == 'right') {
		this.__setRightEye(0);
	} else {
		this.__setLeftEye(0);
		this.__setRightEye(0);
	}
};

AlbertSchool.prototype.turnBodyLed = function(on) {
	this.__setBodyLed(on == 'on' ? 1 : 0);
};

AlbertSchool.prototype.turnFrontLed = function(on) {
	this.__setFrontLed(on == 'on' ? 1 : 0);
};

AlbertSchool.prototype.runBeep = function(count, id, callback) {
	if(count) {
		var self = this;
		var motoring = self.motoring;
		motoring.buzzer = 440;
		self.__setNote(0);
		self.noteTimer1 = setTimeout(function() {
			if(!id || self.noteId == id) {
				motoring.buzzer = 0;
				if(self.noteTimer1 !== undefined) self.__removeTimeout(self.noteTimer1);
				self.noteTimer1 = undefined;
			}
		}, 100);
		self.timeouts.push(self.noteTimer1);
		self.noteTimer2 = setTimeout(function() {
			if(!id || self.noteId == id) {
				motoring.buzzer = 0;
				if(self.noteTimer2 !== undefined) self.__removeTimeout(self.noteTimer2);
				self.noteTimer2 = undefined;
				if(count < 0) {
					self.runBeep(-1, id, callback);
				} else if(count == 1) {
					self.__cancelNote();
					if(id && callback) callback();
				} else {
					self.runBeep(count - 1, id, callback);
				}
			}
		}, 200);
		self.timeouts.push(self.noteTimer2);
	}
};

AlbertSchool.prototype.beep = function(callback) {
	this.__cancelNote();
	var id = this.__issueNoteId();
	this.runBeep(1, id, callback);
};

AlbertSchool.prototype.setBuzzer = function(hz) {
	var motoring = this.motoring;
	this.__cancelNote();
	
	hz = parseFloat(hz);
	if(typeof hz == 'number') {
		motoring.buzzer = hz;
	}
	this.__setNote(0);
};

AlbertSchool.prototype.changeBuzzer = function(hz) {
	var motoring = this.motoring;
	this.__cancelNote();
	
	hz = parseFloat(hz);
	if(typeof hz == 'number') {
		motoring.buzzer += hz;
	}
	this.__setNote(0);
};

AlbertSchool.prototype.clearBuzzer = function() {
	this.__cancelNote();
	this.motoring.buzzer = 0;
	this.__setNote(0);
};

AlbertSchool.prototype.__NOTES = {
	'C': 4,
	'C♯ (D♭)': 5,
	'D': 6,
	'D♯ (E♭)': 7,
	'E': 8,
	'F': 9,
	'F♯ (G♭)': 10,
	'G': 11,
	'G♯ (A♭)': 12,
	'A': 13,
	'A♯ (B♭)': 14,
	'B': 15
};

AlbertSchool.prototype.playNote = function(note, octave) {
	var motoring = this.motoring;
	this.__cancelNote();
	
	note = this.__NOTES[note];
	octave = parseInt(octave);
	motoring.buzzer = 0;
	if(note && octave && octave > 0 && octave < 8) {
		note += (octave - 1) * 12;
		this.__setNote(note);
	} else {
		this.__setNote(0);
	}
};

AlbertSchool.prototype.playNoteBeat = function(note, octave, beat, callback) {
	var self = this;
	var motoring = self.motoring;
	self.__cancelNote();
	
	note = self.__NOTES[note];
	octave = parseInt(octave);
	beat = parseFloat(beat);
	motoring.buzzer = 0;
	if(note && octave && octave > 0 && octave < 8 && beat && beat > 0 && self.tempo > 0) {
		var id = self.__issueNoteId();
		note += (octave - 1) * 12;
		self.__setNote(note);
		var timeout = beat * 60 * 1000 / self.tempo;
		var tail = (timeout > 100) ? 100 : 0;
		if(tail > 0) {
			self.noteTimer1 = setTimeout(function() {
				if(self.noteId == id) {
					self.__setNote(0);
					if(self.noteTimer1 !== undefined) self.__removeTimeout(self.noteTimer1);
					self.noteTimer1 = undefined;
				}
			}, timeout - tail);
			self.timeouts.push(self.noteTimer1);
		}
		self.noteTimer2 = setTimeout(function() {
			if(self.noteId == id) {
				self.__setNote(0);
				self.__cancelNote();
				callback();
			}
		}, timeout);
		self.timeouts.push(self.noteTimer2);
	} else {
		self.__setNote(0);
		callback();
	}
};

AlbertSchool.prototype.restBeat = function(beat, callback) {
	var self = this;
	var motoring = self.motoring;
	self.__cancelNote();
	
	beat = parseFloat(beat);
	motoring.buzzer = 0;
	self.__setNote(0);
	if(beat && beat > 0 && self.tempo > 0) {
		var id = self.__issueNoteId();
		self.noteTimer1 = setTimeout(function() {
			if(self.noteId == id) {
				self.__cancelNote();
				callback();
			}
		}, beat * 60 * 1000 / self.tempo);
		self.timeouts.push(self.noteTimer1);
	} else {
		callback();
	}
};

AlbertSchool.prototype.setTempo = function(bpm) {
	bpm = parseFloat(bpm);
	if(typeof bpm == 'number') {
		this.tempo = bpm;
		if(this.tempo < 1) this.tempo = 1;
	}
};

AlbertSchool.prototype.changeTempo = function(bpm) {
	bpm = parseFloat(bpm);
	if(typeof bpm == 'number') {
		this.tempo += bpm;
		if(this.tempo < 1) this.tempo = 1;
	}
};

AlbertSchool.prototype.getLeftProximity = function() {
	return this.sensory.leftProximity;
};

AlbertSchool.prototype.getRightProximity = function() {
	return this.sensory.rightProximity;
};

AlbertSchool.prototype.getAccelerationX = function() {
	return this.sensory.accelerationX;
};

AlbertSchool.prototype.getAccelerationY = function() {
	return this.sensory.accelerationY;
};

AlbertSchool.prototype.getAccelerationZ = function() {
	return this.sensory.accelerationZ;
};

AlbertSchool.prototype.getFrontOid = function() {
	return this.sensory.frontOid;
};

AlbertSchool.prototype.getRearOid = function() {
	return this.sensory.rearOid;
};

AlbertSchool.prototype.getPositionX = function() {
	return this.sensory.positionX;
};

AlbertSchool.prototype.getPositionY = function() {
	return this.sensory.positionY;
};

AlbertSchool.prototype.getOrientation = function() {
	return this.sensory.orientation;
};

AlbertSchool.prototype.getLight = function() {
	return this.sensory.light;
};

AlbertSchool.prototype.getTemperature = function() {
	return this.sensory.temperature;
};

AlbertSchool.prototype.getSignalStrength = function() {
	return this.sensory.signalStrength;
};

AlbertSchool.prototype.checkHandFound = function() {
	var sensory = this.sensory;
	return (sensory.handFound === undefined) ? (sensory.leftProximity > 40 || sensory.rightProximity > 40) : sensory.handFound;
};

AlbertSchool.prototype.checkOid = function(oid, value) {
	value = parseInt(value);
	if(typeof value == 'number') {
		switch(oid) {
			case 'front': return this.sensory.frontOid == value;
			case 'rear': return this.sensory.rearOid == value;
		}
	}
	return false;
};

AlbertSchool.prototype.checkTilt = function(tilt) {
	switch(tilt) {
		case 'tilt forward': return this.sensory.tilt == 1;
		case 'tilt backward': return this.sensory.tilt == -1;
		case 'tilt left': return this.sensory.tilt == 2;
		case 'tilt right': return this.sensory.tilt == -2;
		case 'tilt flip': return this.sensory.tilt == 3;
		case 'not tilt': return this.sensory.tilt == -3;
	}
	return false;
};

AlbertSchool.prototype.__BATTERY_STATES = {
	'normal': 2,
	'low': 1,
	'empty': 0
};

AlbertSchool.prototype.checkBattery = function(battery) {
	return this.sensory.batteryState == this.__BATTERY_STATES[battery];
};

const RoboidUtil = {
	toNumber: function(value, defaultValue) {
		if(defaultValue === undefined) defaultValue = 0;
		const n = Number(value);
		if(isNaN(n)) return defaultValue;
		return n;
	},
	toBoolean: function(value) {
		if(typeof value === 'boolean') {
			return value;
		}
		if(typeof value === 'string') {
			if((value === '') || (value === '0') || (value.toLowerCase() === 'false')) {
				return false;
			}
			return true;
		}
		return Boolean(value);
	},
	toString: function(value) {
		return String(value);
	},
	hexToRgb: function(hex) {
		const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	},
	decimalToRgb: function(decimal) {
		const a = (decimal >> 24) & 0xff;
		const r = (decimal >> 16) & 0xff;
		const g = (decimal >> 8) & 0xff;
		const b = decimal & 0xff;
		return {r: r, g: g, b: b, a: a > 0 ? a : 255};
	},
	toRgbArray: function(value) {
		let color;
		if(typeof value === 'string' && value.substring(0, 1) === '#') {
			color = RoboidUtil.hexToRgb(value);
		} else {
			color = RoboidUtil.decimalToRgb(RoboidUtil.toNumber(value));
		}
		return [color.r, color.g, color.b];
	}
};

class RoboidRunner {
	constructor(creators) {
		this.creators = creators;
		this.robots = {};
		this.robotsByGroup = {};
		this.robotsByModule = {};
		this.packet = {};
		this.retryId = undefined;
		this.alive = false;
		this.canSend = false;
	}
	
	addRobotByModule(module, key, robot) {
		let robots = this.robotsByModule[module];
		if(robots === undefined) {
			robots = this.robotsByModule[module] = {};
		}
		robots[key] = robot;
	}
	
	getOrCreateRobot(group, module, index) {
		const robots = this.robots;
		const key = module + index;
		let robot = robots[key];
		if(!robot) {
			const creator = this.creators[module];
			if(creator) {
				robot = creator(index);
			}
			if(robot) {
				robots[key] = robot;
				this.packet[key] = robot.motoring;
				this.addRobotByModule(module, key, robot);
			}
		}
		this.robotsByGroup[group + index] = robot;
		return robot;
	}
	
	getRobot(group, index) {
		return this.robotsByGroup[group + index];
	}
	
	clearMotorings() {
		const robots = this.robots;
		for(const i in robots) {
			robots[i].clearMotoring();
		}
	}
	
	afterTick() {
		const robots = this.robots;
		for(const i in robots) {
			robots[i].clearEvent();
		}
	}
	
	reset(module) {
		const robots = this.robotsByModule[module];
		if(robots) {
			for(const i in robots) {
				robots[i].reset();
			}
		}
	}
	
	open() {
		try {
			const self = this;
			const sock = new WebSocket('ws://localhost:56417');
			sock.binaryType = 'arraybuffer';
			self.socket = sock;
			sock.onmessage = function(message) {
				try {
					const received = JSON.parse(message.data);
					if(received.type == 0) {
					} else if(received.type == 2) {
						for(const module in received.modules) {
						}
					} else {
						if(received.index >= 0) {
							const robot = self.getOrCreateRobot(received.group, received.module, received.index);
							if(robot) {
								robot.clearEvent();
								robot.sensory = received;
								robot.handleSensory();
							}
						}
					}
				} catch (e) {
				}
			};
			sock.onclose = function() {
				self.alive = false;
				self.canSend = false;
				if(self.retryId === undefined) {
					self.retryId = setInterval(function() {
						if(self.alive) {
							if(self.retryId !== undefined) {
								clearInterval(self.retryId);
								self.retryId = undefined;
							}
						} else {
							self.open();
						}
					}, 2000);
				}
			};
			sock.onopen = function() {
				self.alive = true;
				
				let targetTime = Date.now();
				const run = function() {
					if(self.canSend && self.socket) {
						if(Date.now() > targetTime) {
							try {
								const json = JSON.stringify(self.packet);
								if(self.canSend && self.socket) self.socket.send(json);
								self.clearMotorings();
							} catch (e) {
							}
							targetTime += 20;
						}
						setTimeout(run, 5);
					}
				};
				self.canSend = true;
				run();
			};
			return true;
		} catch(e) {
		}
		return false;
	}
	
	close() {
		this.canSend = false;
		if(this.socket) {
			this.socket.close();
			this.socket = undefined;
		}
	}
}

class AlbertSchoolExtension {
	constructor(runtime) {
		this.runtime = runtime;
		if(runtime.roboidCreators === undefined) {
			runtime.roboidCreators = {};
		}
		runtime.roboidCreators['albertschool'] = function(index) {
			return new AlbertSchool(index);
		};
		if(runtime.roboidRunner === undefined) {
			runtime.roboidRunner = new RoboidRunner(runtime.roboidCreators);
			setTimeout(() => {
				runtime.roboidRunner.open();
			}, 1000);
		}
		runtime.registerPeripheralExtension('albertschool', this);
		runtime.on('PROJECT_STOP_ALL', this.onStop.bind(this));
	}
	
	onStop() {
		if(this.runtime.roboidRunner) {
			this.runtime.roboidRunner.reset('albertschool');
		}
	}
	
	getInfo() {
		return {
			id: 'albertschool',
			name: '알버트 스쿨',
      color1: '#0FBD8C',
      color2: '#0DA57A',
			menuIconURI: Resource.iconURI,
			blockIconURI: Resource.iconURI,
			blocks: [
				{"opcode":"albertschoolMoveForwardForSecs","text":"앞으로 [SECS]초 이동하기","blockType":"command","arguments":{"SECS":{"type":"number","defaultValue":1}},"func":"albertschoolMoveForwardForSecs","blockCategory":"motion"},
				{"opcode":"albertschoolMoveBackwardForSecs","text":"뒤로 [SECS]초 이동하기","blockType":"command","arguments":{"SECS":{"type":"number","defaultValue":1}},"func":"albertschoolMoveBackwardForSecs","blockCategory":"motion"},
				{"opcode":"albertschoolTurnForSecs","text":"[DIRECTION]으로 [SECS]초 돌기","blockType":"command","arguments":{"DIRECTION":{"type":"string","menu":"left_right","defaultValue":"left"},"SECS":{"type":"number","defaultValue":1}},"func":"albertschoolTurnForSecs","blockCategory":"motion"},
				{"opcode":"albertschoolChangeBothWheelsBy","text":"왼쪽 바퀴 [LEFT] 오른쪽 바퀴 [RIGHT]만큼 바꾸기","blockType":"command","arguments":{"LEFT":{"type":"number","defaultValue":10},"RIGHT":{"type":"number","defaultValue":10}},"func":"albertschoolChangeBothWheelsBy","blockCategory":"motion"},
				{"opcode":"albertschoolSetBothWheelsTo","text":"왼쪽 바퀴 [LEFT] 오른쪽 바퀴 [RIGHT](으)로 정하기","blockType":"command","arguments":{"LEFT":{"type":"number","defaultValue":30},"RIGHT":{"type":"number","defaultValue":30}},"func":"albertschoolSetBothWheelsTo","blockCategory":"motion"},
				{"opcode":"albertschoolChangeWheelBy","text":"[WHEEL] 바퀴 [VALUE]만큼 바꾸기","blockType":"command","arguments":{"WHEEL":{"type":"string","menu":"left_right_both","defaultValue":"left"},"VALUE":{"type":"number","defaultValue":10}},"func":"albertschoolChangeWheelBy","blockCategory":"motion"},
				{"opcode":"albertschoolSetWheelTo","text":"[WHEEL] 바퀴 [VALUE](으)로 정하기","blockType":"command","arguments":{"WHEEL":{"type":"string","menu":"left_right_both","defaultValue":"left"},"VALUE":{"type":"number","defaultValue":30}},"func":"albertschoolSetWheelTo","blockCategory":"motion"},
				{"opcode":"albertschoolStop","text":"정지하기","blockType":"command","func":"albertschoolStop","blockCategory":"motion"},
				{"opcode":"albertschoolSetBoardSizeTo","text":"말판 크기를 폭 [WIDTH] 높이 [HEIGHT](으)로 정하기","blockType":"command","arguments":{"WIDTH":{"type":"number","defaultValue":108},"HEIGHT":{"type":"number","defaultValue":76}},"func":"albertschoolSetBoardSizeTo","blockCategory":"motion"},
				{"opcode":"albertschoolMoveToOnBoard","text":"말판 [TOWARD] x: [X] y: [Y] 위치로 이동하기","blockType":"command","arguments":{"TOWARD":{"type":"string","menu":"move_forward_backward","defaultValue":"forward"},"X":{"type":"number","defaultValue":0},"Y":{"type":"number","defaultValue":0}},"func":"albertschoolMoveToOnBoard","blockCategory":"motion"},
				{"opcode":"albertschoolSetOrientationToOnBoard","text":"말판 [DEGREE]도 방향으로 돌기","blockType":"command","arguments":{"DEGREE":{"type":"number","defaultValue":0}},"func":"albertschoolSetOrientationToOnBoard","blockCategory":"motion"},"---",
				{"opcode":"albertschoolSetEyeTo","text":"[EYE] 눈을 [COLOR]으로 정하기","blockType":"command","arguments":{"EYE":{"type":"string","menu":"left_right_both","defaultValue":"left"},"COLOR":{"type":"string","menu":"color","defaultValue":"red"}},"func":"albertschoolSetEyeTo","blockCategory":"looks"},
				{"opcode":"albertschoolClearEye","text":"[EYE] 눈 끄기","blockType":"command","arguments":{"EYE":{"type":"string","menu":"left_right_both","defaultValue":"left"}},"func":"albertschoolClearEye","blockCategory":"looks"},
				{"opcode":"albertschoolTurnBodyLed","text":"몸통 LED [ONOFF]","blockType":"command","arguments":{"ONOFF":{"type":"string","menu":"on_off","defaultValue":"on"}},"func":"albertschoolTurnBodyLed","blockCategory":"looks"},
				{"opcode":"albertschoolTurnFrontLed","text":"앞쪽 LED [ONOFF]","blockType":"command","arguments":{"ONOFF":{"type":"string","menu":"on_off","defaultValue":"on"}},"func":"albertschoolTurnFrontLed","blockCategory":"looks"},"---",
				{"opcode":"albertschoolBeep","text":"삐 소리내기","blockType":"command","func":"albertschoolBeep","blockCategory":"sound"},
				{"opcode":"albertschoolChangeBuzzerBy","text":"버저 음을 [HZ]만큼 바꾸기","blockType":"command","arguments":{"HZ":{"type":"number","defaultValue":10}},"func":"albertschoolChangeBuzzerBy","blockCategory":"sound"},
				{"opcode":"albertschoolSetBuzzerTo","text":"버저 음을 [HZ](으)로 정하기","blockType":"command","arguments":{"HZ":{"type":"number","defaultValue":1000}},"func":"albertschoolSetBuzzerTo","blockCategory":"sound"},
				{"opcode":"albertschoolClearBuzzer","text":"버저 끄기","blockType":"command","func":"albertschoolClearBuzzer","blockCategory":"sound"},
				{"opcode":"albertschoolPlayNote","text":"[NOTE][OCTAVE] 음을 연주하기","blockType":"command","arguments":{"NOTE":{"type":"string","menu":"note","defaultValue":"C"},"OCTAVE":{"type":"string","menu":"octave","defaultValue":"4"}},"func":"albertschoolPlayNote","blockCategory":"sound"},
				{"opcode":"albertschoolPlayNoteFor","text":"[NOTE][OCTAVE] 음을 [BEAT]박자 연주하기","blockType":"command","arguments":{"NOTE":{"type":"string","menu":"note","defaultValue":"C"},"OCTAVE":{"type":"string","menu":"octave","defaultValue":"4"},"BEAT":{"type":"number","defaultValue":0.5}},"func":"albertschoolPlayNoteFor","blockCategory":"sound"},
				{"opcode":"albertschoolRestFor","text":"[BEAT]박자 쉬기","blockType":"command","arguments":{"BEAT":{"type":"number","defaultValue":0.25}},"func":"albertschoolRestFor","blockCategory":"sound"},
				{"opcode":"albertschoolChangeTempoBy","text":"연주 속도를 [BPM]만큼 바꾸기","blockType":"command","arguments":{"BPM":{"type":"number","defaultValue":20}},"func":"albertschoolChangeTempoBy","blockCategory":"sound"},
				{"opcode":"albertschoolSetTempoTo","text":"연주 속도를 [BPM]BPM으로 정하기","blockType":"command","arguments":{"BPM":{"type":"number","defaultValue":60}},"func":"albertschoolSetTempoTo","blockCategory":"sound"},"---",
				{"opcode":"albertschoolLeftProximity","text":"왼쪽 근접 센서","blockType":"reporter","func":"albertschoolLeftProximity","blockCategory":"sensing"},
				{"opcode":"albertschoolRightProximity","text":"오른쪽 근접 센서","blockType":"reporter","func":"albertschoolRightProximity","blockCategory":"sensing"},
				{"opcode":"albertschoolAccelerationX","text":"x축 가속도","blockType":"reporter","func":"albertschoolAccelerationX","blockCategory":"sensing"},
				{"opcode":"albertschoolAccelerationY","text":"y축 가속도","blockType":"reporter","func":"albertschoolAccelerationY","blockCategory":"sensing"},
				{"opcode":"albertschoolAccelerationZ","text":"z축 가속도","blockType":"reporter","func":"albertschoolAccelerationZ","blockCategory":"sensing"},
				{"opcode":"albertschoolFrontOid","text":"앞쪽 OID","blockType":"reporter","func":"albertschoolFrontOid","blockCategory":"sensing"},
				{"opcode":"albertschoolBackOid","text":"뒤쪽 OID","blockType":"reporter","func":"albertschoolBackOid","blockCategory":"sensing"},
				{"opcode":"albertschoolPositionX","text":"x 위치","blockType":"reporter","func":"albertschoolPositionX","blockCategory":"sensing"},
				{"opcode":"albertschoolPositionY","text":"y 위치","blockType":"reporter","func":"albertschoolPositionY","blockCategory":"sensing"},
				{"opcode":"albertschoolOrientation","text":"방향","blockType":"reporter","func":"albertschoolOrientation","blockCategory":"sensing"},
				{"opcode":"albertschoolLight","text":"밝기","blockType":"reporter","func":"albertschoolLight","blockCategory":"sensing"},
				{"opcode":"albertschoolTemperature","text":"온도","blockType":"reporter","func":"albertschoolTemperature","blockCategory":"sensing"},
				{"opcode":"albertschoolSignalStrength","text":"신호 세기","blockType":"reporter","func":"albertschoolSignalStrength","blockCategory":"sensing"},
				{"opcode":"albertschoolWhenHandFound","text":"손 찾았을 때","blockType":"hat","func":"albertschoolWhenHandFound","blockCategory":"sensing"},
				{"opcode":"albertschoolWhenOid","text":"[OID] OID가 [VALUE]일 때","blockType":"hat","arguments":{"OID":{"type":"string","menu":"front_rear","defaultValue":"front"},"VALUE":{"type":"number","defaultValue":0}},"func":"albertschoolWhenOid","blockCategory":"sensing"},
				{"opcode":"albertschoolWhenTilt","text":"[TILT] 때","blockType":"hat","arguments":{"TILT":{"type":"string","menu":"when_tilt","defaultValue":"tilt forward"}},"func":"albertschoolWhenTilt","blockCategory":"sensing"},
				{"opcode":"albertschoolHandFound","text":"손 찾음?","blockType":"Boolean","func":"albertschoolHandFound","blockCategory":"sensing"},
				{"opcode":"albertschoolOid","text":"[OID] OID가 [VALUE]인가?","blockType":"Boolean","arguments":{"OID":{"type":"string","menu":"front_rear","defaultValue":"front"},"VALUE":{"type":"number","defaultValue":0}},"func":"albertschoolOid","blockCategory":"sensing"},
				{"opcode":"albertschoolTilt","text":"[TILT]?","blockType":"Boolean","arguments":{"TILT":{"type":"string","menu":"tilt","defaultValue":"tilt forward"}},"func":"albertschoolTilt","blockCategory":"sensing"},
				{"opcode":"albertschoolBatteryState","text":"배터리 [BATTERY]?","blockType":"Boolean","arguments":{"BATTERY":{"type":"string","menu":"battery","defaultValue":"normal"}},"func":"albertschoolBatteryState","blockCategory":"sensing"}
			],
			menus: {
				"left_right":[{"text":"왼쪽","value":"left"},{"text":"오른쪽","value":"right"}],
				"left_right_both":[{"text":"왼쪽","value":"left"},{"text":"오른쪽","value":"right"},{"text":"양쪽","value":"both"}],
				"front_rear":[{"text":"앞쪽","value":"front"},{"text":"뒤쪽","value":"rear"}],
				"move_forward_backward":[{"text":"앞으로","value":"forward"},{"text":"뒤로","value":"backward"}],
				"board_size":[{"text":"37","value":"37"},{"text":"53","value":"53"},{"text":"76","value":"76"},{"text":"108","value":"108"},{"text":"153","value":"153"},{"text":"217","value":"217"}],
				"color":[{"text":"빨간색","value":"red"},{"text":"노란색","value":"yellow"},{"text":"초록색","value":"green"},{"text":"하늘색","value":"sky blue"},{"text":"파란색","value":"blue"},{"text":"자주색","value":"purple"},{"text":"하얀색","value":"white"}],
				"on_off":[{"text":"켜기","value":"on"},{"text":"끄기","value":"off"}],
				"note":[{"text":"도","value":"C"},{"text":"도♯ (레♭)","value":"C♯ (D♭)"},{"text":"레","value":"D"},{"text":"레♯ (미♭)","value":"D♯ (E♭)"},{"text":"미","value":"E"},{"text":"파","value":"F"},{"text":"파♯ (솔♭)","value":"F♯ (G♭)"},{"text":"솔","value":"G"},{"text":"솔♯ (라♭)","value":"G♯ (A♭)"},{"text":"라","value":"A"},{"text":"라♯ (시♭)","value":"A♯ (B♭)"},{"text":"시","value":"B"}],
				"octave":[{"text":"1","value":"1"},{"text":"2","value":"2"},{"text":"3","value":"3"},{"text":"4","value":"4"},{"text":"5","value":"5"},{"text":"6","value":"6"},{"text":"7","value":"7"}],
				"when_tilt":[{"text":"앞으로 기울였을","value":"tilt forward"},{"text":"뒤로 기울였을","value":"tilt backward"},{"text":"왼쪽으로 기울였을","value":"tilt left"},{"text":"오른쪽으로 기울였을","value":"tilt right"},{"text":"거꾸로 뒤집었을","value":"tilt flip"},{"text":"기울이지 않았을","value":"not tilt"}],
				"tilt":[{"text":"앞으로 기울임","value":"tilt forward"},{"text":"뒤로 기울임","value":"tilt backward"},{"text":"왼쪽으로 기울임","value":"tilt left"},{"text":"오른쪽으로 기울임","value":"tilt right"},{"text":"거꾸로 뒤집음","value":"tilt flip"},{"text":"기울이지 않음","value":"not tilt"}],
				"battery":[{"text":"정상","value":"normal"},{"text":"부족","value":"low"},{"text":"없음","value":"empty"}]
			}
		};
	}
	
	getRobot(args) {
		if(args.INDEX === undefined) {
			if(this.runtime.roboidRunner) {
				return this.runtime.roboidRunner.getRobot('albertschool', 0);
			}
		} else {
			const index = RoboidUtil.toNumber(args.INDEX, -1);
			if(index >= 0 && this.runtime.roboidRunner) {
				return this.runtime.roboidRunner.getRobot('albertschool', index);
			}
		}
	}
	
	albertschoolMoveForwardForSecs(args) {
		return new Promise(resolve => {
			const robot = this.getRobot(args);
			if(robot) robot.moveForwardSecs(args.SECS, resolve);
		});
	}
	
	albertschoolMoveBackwardForSecs(args) {
		return new Promise(resolve => {
			const robot = this.getRobot(args);
			if(robot) robot.moveBackwardSecs(args.SECS, resolve);
		});
	}
	
	albertschoolTurnForSecs(args) {
		return new Promise(resolve => {
			const robot = this.getRobot(args);
			if(robot) robot.turnSecs(args.DIRECTION, args.SECS, resolve);
		});
	}
	
	albertschoolChangeBothWheelsBy(args) {
		const robot = this.getRobot(args);
		if(robot) robot.changeWheels(args.LEFT, args.RIGHT);
	}
	
	albertschoolSetBothWheelsTo(args) {
		const robot = this.getRobot(args);
		if(robot) robot.setWheels(args.LEFT, args.RIGHT);
	}
	
	albertschoolChangeWheelBy(args) {
		const robot = this.getRobot(args);
		if(robot) robot.changeWheel(args.WHEEL, args.VALUE);
	}
	
	albertschoolSetWheelTo(args) {
		const robot = this.getRobot(args);
		if(robot) robot.setWheel(args.WHEEL, args.VALUE);
	}
	
	albertschoolStop(args) {
		const robot = this.getRobot(args);
		if(robot) robot.stop();
	}
	
	albertschoolSetBoardSizeTo(args) {
		const robot = this.getRobot(args);
		if(robot) robot.setBoardSize(args.WIDTH, args.HEIGHT);
	}
	
	albertschoolMoveToOnBoard(args) {
		return new Promise(resolve => {
			const robot = this.getRobot(args);
			if(robot) robot.moveToOnBoard(args.TOWARD, args.X, args.Y, resolve);
		});
	}
	
	albertschoolSetOrientationToOnBoard(args) {
		return new Promise(resolve => {
			const robot = this.getRobot(args);
			if(robot) robot.setOrientationToOnBoard(args.DEGREE, resolve);
		});
	}
	
	albertschoolSetEyeTo(args) {
		const robot = this.getRobot(args);
		if(robot) robot.setEye(args.EYE, args.COLOR);
	}
	
	albertschoolClearEye(args) {
		const robot = this.getRobot(args);
		if(robot) robot.clearEye(args.EYE);
	}
	
	albertschoolTurnBodyLed(args) {
		const robot = this.getRobot(args);
		if(robot) robot.turnBodyLed(args.ONOFF);
	}
	
	albertschoolTurnFrontLed(args) {
		const robot = this.getRobot(args);
		if(robot) robot.turnFrontLed(args.ONOFF);
	}
	
	albertschoolBeep(args) {
		return new Promise(resolve => {
			const robot = this.getRobot(args);
			if(robot) robot.beep(resolve);
		});
	}
	
	albertschoolChangeBuzzerBy(args) {
		const robot = this.getRobot(args);
		if(robot) robot.changeBuzzer(args.HZ);
	}
	
	albertschoolSetBuzzerTo(args) {
		const robot = this.getRobot(args);
		if(robot) robot.setBuzzer(args.HZ);
	}
	
	albertschoolClearBuzzer(args) {
		const robot = this.getRobot(args);
		if(robot) robot.clearBuzzer();
	}
	
	albertschoolPlayNote(args) {
		const robot = this.getRobot(args);
		if(robot) robot.playNote(args.NOTE, args.OCTAVE);
	}
	
	albertschoolPlayNoteFor(args) {
		return new Promise(resolve => {
			const robot = this.getRobot(args);
			if(robot) robot.playNoteBeat(args.NOTE, args.OCTAVE, args.BEAT, resolve);
		});
	}
	
	albertschoolRestFor(args) {
		return new Promise(resolve => {
			const robot = this.getRobot(args);
			if(robot) robot.restBeat(args.BEAT, resolve);
		});
	}
	
	albertschoolChangeTempoBy(args) {
		const robot = this.getRobot(args);
		if(robot) robot.changeTempo(args.BPM);
	}
	
	albertschoolSetTempoTo(args) {
		const robot = this.getRobot(args);
		if(robot) robot.setTempo(args.BPM);
	}
	
	albertschoolLeftProximity(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getLeftProximity() : 0;
	}
	
	albertschoolRightProximity(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getRightProximity() : 0;
	}
	
	albertschoolAccelerationX(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getAccelerationX() : 0;
	}
	
	albertschoolAccelerationY(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getAccelerationY() : 0;
	}
	
	albertschoolAccelerationZ(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getAccelerationZ() : 0;
	}
	
	albertschoolFrontOid(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getFrontOid() : -1;
	}
	
	albertschoolBackOid(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getRearOid() : -1;
	}
	
	albertschoolPositionX(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getPositionX() : -1;
	}
	
	albertschoolPositionY(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getPositionY() : -1;
	}
	
	albertschoolOrientation(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getOrientation() : -200;
	}
	
	albertschoolLight(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getLight() : 0;
	}
	
	albertschoolTemperature(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getTemperature() : 0;
	}
	
	albertschoolSignalStrength(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getSignalStrength() : 0;
	}
	
	albertschoolWhenHandFound(args) {
		const robot = this.getRobot(args);
		return robot ? robot.checkHandFound() : false;
	}
	
	albertschoolWhenOid(args) {
		const robot = this.getRobot(args);
		return robot ? robot.checkOid(args.OID, args.VALUE) : false;
	}
	
	albertschoolWhenTilt(args) {
		const robot = this.getRobot(args);
		return robot ? robot.checkTilt(args.TILT) : false;
	}
	
	albertschoolHandFound(args) {
		const robot = this.getRobot(args);
		return robot ? robot.checkHandFound() : false;
	}
	
	albertschoolOid(args) {
		const robot = this.getRobot(args);
		return robot ? robot.checkOid(args.OID, args.VALUE) : false;
	}
	
	albertschoolTilt(args) {
		const robot = this.getRobot(args);
		return robot ? robot.checkTilt(args.TILT) : false;
	}
	
	albertschoolBatteryState(args) {
		const robot = this.getRobot(args);
		return robot ? robot.checkBattery(args.BATTERY) : false;
	}
}

if(!Date.now) {
	Date.now = function() {
		return new Date().getTime();
	};
}

module.exports = AlbertSchoolExtension;
