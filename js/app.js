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

  this.rect_bounds = {l: 0, t: 76, r: this.w, b: this.h - 26};
  this.screen_bounds = {x: 0, y: 0, w: canvas.width,  h: canvas.height};
  // {l: 0, t: 76, r: 101, b: 145}
};

// An enemy that re-enters the field from the other side
var WrappingEnemy = function () {
  Enemy.apply(this, arguments);
};

WrappingEnemy.prototype = Object.create(Enemy.prototype);
WrappingEnemy.prototype.constructor = WrappingEnemy;

// An enemy that bounces when hitting the edge of the field
var BouncingEnemy = function () {
  Enemy.apply(this, arguments);
  this.going_right = true;
};

BouncingEnemy.prototype = Object.create(Enemy.prototype);
BouncingEnemy.prototype.constructor = BouncingEnemy;

// a Bouncing Enemy making sporadic decisions and changing directions
var DrunkEnemy = function () {
  BouncingEnemy.apply(this, arguments);
};

DrunkEnemy.prototype = Object.create(BouncingEnemy.prototype);
DrunkEnemy.prototype.constructor = DrunkEnemy;

var Player = function (x, y) {
  Enemy.call(this, x, y, 'images/char-boy.png');

  this.moves = {
    left:  false,
    right: false,
    up:    false,
    down:  false,
    w:     false,
    a:     false,
    s:     false,
    d:     false
  };

  this.shrink = false;
  this.max_w  = this.w * 2;
  this.min_w  = this.w / 2;

  this.do_shrink = false;

  this.rect_bounds = {l: 18, t: 64, r: this.w - 18, b: this.h - 31};
//{l: 18, t: 64, r: 83, b: 140}
};

Player.prototype = Object.create(Enemy.prototype);
Player.prototype.constructor = Player;

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
};

WrappingEnemy.prototype.update = function(dt) {
  this.x += 1;
  if (this.x > 500) {
    this.x = 0;
  }
};

BouncingEnemy.prototype.update = function(dt) {
  if (this.going_right) {
    this.x += 1;
    if (this.x + this.rect_bounds.l > this.screen_bounds.w) {
      this.x = this.screen_bounds.w;
      this.going_right = false;
    }
  } else {
    this.x -= 1;
    if (this.x + this.rect_bounds.r < 0) {
      this.x = -this.rect_bounds.r;
      this.going_right = true;
    }
  }
};

BouncingEnemy.prototype.render = function() {
  if (!this.going_right) {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(this.sprite, -this.x, this.y, -this.w, this.h);
    if (this.hit) {
      ctx.strokeStyle = "green";
    } else {
      ctx.strokeStyle = "black";
    }

    ctx.strokeRect(-1 * (this.x + this.rect_bounds.l),
                   this.y + this.rect_bounds.t,
                   -1 * (this.rect_bounds.r - this.rect_bounds.l),
                   this.rect_bounds.b - this.rect_bounds.t);
    ctx.restore();
  } else {
    Enemy.prototype.render.call(this);
  }
};

Enemy.prototype.left_bound = function() {
  return this.x + this.rect_bounds.l;
};

Enemy.prototype.right_bound = function() {
  return this.x + this.rect_bounds.l;
};

Enemy.prototype.collideEnemy = function(enemy) {
  var er = enemy.rect_bounds;
  var pr = this.rect_bounds;

  enemy.hit = false;

  if (enemy.x + er.r < (this.x + pr.l)) {
    // enemy is to the right
    return;
  }

  if (enemy.y + er.b < this.y + pr.t) {
    // enemy is upper
    return;
  }

  if (this.x + pr.r < enemy.x + er.l) {
    // player is to the right
    // that is enemy is to the left?
    return;
  }

  if (this.y + pr.b < enemy.y + er.t) {
    // enemy is lower
    return;
  }

  // it looks we are intersecting?
  enemy.hit = true;
  this.hit = true;
};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
  ctx.drawImage(this.sprite, this.x, this.y, this.w, this.h);
  if (this.hit) {
    ctx.strokeStyle = "green";
  } else {
    ctx.strokeStyle = "black";
  }

  ctx.strokeRect(this.x + this.rect_bounds.l,
                 this.y + this.rect_bounds.t,
                 this.rect_bounds.r - this.rect_bounds.l,
                 this.rect_bounds.b - this.rect_bounds.t);
};

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.


Player.prototype.update = function(dt) {
  if (this.moves.w) {
    this.rect_bounds.t -= 1;
  }

  if (this.moves.s) {
    this.rect_bounds.t += 1;
  }

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

Enemy.prototype.right = function() {
  return this.x + this.w;
};

Enemy.prototype.bottom = function() {
  return this.y + this.h;
};

Player.prototype.force_screen_bounds = function() {
  if (this.x + this.rect_bounds.l < this.screen_bounds.x) {
    this.x = this.screen_bounds.x - this.rect_bounds.l;
  }

  if (this.x + this.rect_bounds.r > this.screen_bounds.w) {
    this.x = this.screen_bounds.w - this.rect_bounds.r;
  }

  if (this.y + this.rect_bounds.t < this.screen_bounds.y) {
    this.y = this.screen_bounds.y - this.rect_bounds.t;
  }

  if (this.y + this.rect_bounds.b > this.screen_bounds.h) {
    this.y = this.screen_bounds.h - this.rect_bounds.b;
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
    40: 'down',

    87: 'w',
    83: 's',
    65: 'a',
    68: 'd'
  };

  player.handleInput(allowedKeys[e.keyCode], false);
});

document.addEventListener('keydown', function(e) {
  var allowedKeys = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',

    87: 'w',
    83: 's',
    65: 'a',
    68: 'd'
  };

  player.handleInput(allowedKeys[e.keyCode], true);
});
