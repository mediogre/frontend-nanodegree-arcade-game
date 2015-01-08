// Enemies our player must avoid
var Enemy = function(x, y, filename) {
  // Variables applied to each of our instances go here,
  // we've provided one for you to get started
  this.x = x || 100;
  this.y = y || 100;

  // The image/sprite for our enemies, this uses
  // a helper we've provided to easily load images
  this.sprite = Resources.get(filename || 'images/enemy-bug.png');
  
  this.w = this.sprite.width;
  this.h = this.sprite.height;
};

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
  // You should multiply any movement by the dt parameter
  // which will ensure the game runs at the same speed for
  // all computers.

  this.x += 1;
  if (this.x > 500) {
    this.x = 0;
  }
};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
  ctx.drawImage(this.sprite, this.x, this.y, this.w, this.h);
};

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function (x, y) {
  Enemy.call(this, x, y, 'images/char-boy.png');

  this.moves = {
    left:  false,
    right: false,
    up:    false,
    down:  false
  };

  this.shrink = false;
  this.max_w  = this.w * 2;
  this.min_w  = this.w / 2;

  this.do_shrink = false;


  this.screen_bounds = {x: 0, y: 0, w: 500,  h: 600};
};

Player.prototype = Object.create(Enemy.prototype);
Player.prototype.constructor = Player;

Player.prototype.update = function(dt) {
  if (this.moves.left) {
    this.x -= 10;
  }

  if (this.moves.right) {
    this.x += 10;
  }

  if (this.moves.up) {
    this.y -= 10;
  }

  if (this.moves.down) {
    this.y += 10;
  }

  this.force_screen_bounds();

  if (this.do_shrink) {
    var shrink_rate = 4;
    if (this.shrink) {
      this.w -= shrink_rate;
      this.h -= shrink_rate;
      if (this.w < this.min_w) {
        this.shrink = false;
      }
    } else {
      this.w += shrink_rate;
      this.h += shrink_rate;
      if (this.w > this.max_w) {
        this.shrink = true;
      }
    }
  }
};

Player.prototype.right = function() {
  return this.x + this.w;
};

Player.prototype.bottom = function() {
  return this.y + this.h;
};

Player.prototype.force_screen_bounds = function() {
  if (this.x < this.screen_bounds.x) {
    this.x = this.screen_bounds.x;
  }

  if (this.right() > this.screen_bounds.w) {
    this.x = this.screen_bounds.w - this.w;
  }

  if (this.y < this.screen_bounds.y) {
    this.y = this.screen_bounds.y;
  }

  if (this.bottom() > this.screen_bounds.h) {
    this.y = this.screen_bounds.h - this.h;
  }
};

Player.prototype.handleInput = function(movement, val) {
  this.moves[movement] = val;
};

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player



// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
  var allowedKeys = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  };

  player.handleInput(allowedKeys[e.keyCode], false);
});

document.addEventListener('keydown', function(e) {
  var allowedKeys = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  };

  player.handleInput(allowedKeys[e.keyCode], true);
});
