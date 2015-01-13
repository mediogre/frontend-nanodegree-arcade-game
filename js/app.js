/**
 * Generic Enemy - can render itself, collide with the player
 * @constructor
 */
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

// a and b are rectangles (AABBs)
// return true if they intersect each other
// return false otherwise
Enemy.rects_intersect = function(a, b) {
  return !(a.right < b.left || b.right < a.left || a.bottom < b.top || b.bottom < a.top);
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
  this.x += Math.floor(200 * dt);
  if (this.x > this.screen_bounds.w) {
    this.x = 0;
  }
};

WrappingEnemy.prototype.bounding_boxes = function() {
  var boxes = Enemy.prototype.bounding_boxes.call(this);

  var wrapped_part = (this.x + this.rect_bounds.r) - this.screen_bounds.w;
  if (wrapped_part > 0) {
    boxes.push({left: 0,
                top: this.y + this.rect_bounds.t,
                right: wrapped_part,
                bottom: this.y + this.rect_bounds.b});
  }
  return boxes;
};

WrappingEnemy.prototype.render = function() {
  var wrapped_part = (this.x + this.rect_bounds.r) - this.screen_bounds.w;
  if (wrapped_part > 0) {
    ctx.drawImage(this.sprite, 
                  this.screen_bounds.w - this.x, 0, 
                  wrapped_part, this.sprite.height,
                  0, this.y,
                  wrapped_part, this.sprite.height);
  }
  ctx.drawImage(this.sprite, this.x, this.y, this.w, this.h);
  this.debug_render();
};

BouncingEnemy.prototype.update = function(dt) {
  if (this.going_right) {
    this.x += 10;
    if (this.x + this.rect_bounds.l > this.screen_bounds.w) {
      this.x = this.screen_bounds.w;
      this.going_right = false;
    }
  } else {
    this.x -= 10;
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
    ctx.restore();
    this.debug_render();
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

Enemy.prototype.unhit = function() {
  this.hit_ = false;
};

Enemy.prototype.hit = function() {
  this.hit_ = true;
};

Enemy.prototype.isHit = function() {
  return this.hit_;
};

Enemy.prototype.collide = function(other) {
  var other_rects = other.bounding_boxes();
  var own_rects   = this.bounding_boxes();

  for (var i = 0, l = own_rects.length; i < l; i++) {
    for (var j = 0, ol = other_rects.length; j < ol; j++) {
      if (Enemy.rects_intersect(own_rects[i], other_rects[j])) {
        this.hit();
        other.hit();
        return;
      }
    }
  }
};

Enemy.prototype.bounding_boxes = function() {
  return [{left: this.x + this.rect_bounds.l,
           top:  this.y + this.rect_bounds.t,
           right: this.x + this.rect_bounds.r,
           bottom: this.y + this.rect_bounds.b}];
};

Enemy.prototype.debug_render = function() {
  if (this.isHit()) {
    var prevStrokeStyle = ctx.strokeStyle;
    ctx.strokeStyle = "red";

    var boxes = this.bounding_boxes();
    var i, l, box;
    for (i = 0, l = boxes.length; i < l; i++) {
      box = boxes[i];
      ctx.strokeRect(box.left, box.top,
                     box.right - box.left,
                     box.bottom - box.top);
    }
    ctx.strokeStyle = prevStrokeStyle;
  }
};
// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
  ctx.drawImage(this.sprite, this.x, this.y, this.w, this.h);
  this.debug_render();
};

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.


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

// store the input in "keypresses" table
Player.prototype.handleInput = function(movement, val) {
  this.moves[movement] = val;
};

Player.keys = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',

    87: 'up',   // 'w'
    83: 'down', // 's'
    65: 'left', // 'a'
    68: 'right' // 'd'
};

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
  player.handleInput(Player.keys[e.keyCode], false);
});

document.addEventListener('keydown', function(e) {
  player.handleInput(Player.keys[e.keyCode], true);
});
