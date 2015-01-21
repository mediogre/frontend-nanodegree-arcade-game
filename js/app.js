/**
 * Generic Enemy (more like Entity but keeping the original name)
 * - it can render itself,
 * - collide with another "enemy" and get hit
 * - update itself
 * @constructor
 * @param {number} x - initial x position of the enemy
 * @param {number} y - initial y position of the enemy
 * @param {string} filename - sprite to use
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
  this.screen_bounds = {x: 0, y: 52, w: canvas.width,  h: canvas.height - 20};

  this.speed = 222;
};

/**
 * a and b are rectangles (AABBs)
 * @param {{left: number, top: number, right: number, bottom: number}} a
 * @param {{left: number, top: number, right: number, bottom: number}} b
 * @return {boolean} if they intersect each other
 */
Enemy.rects_intersect = function(a, b) {
  return !(a.right < b.left || b.right < a.left || a.bottom < b.top || b.bottom < a.top);
};

/** 
 * Update the enemy's position, required method for game
 * @param {number} dt - a time delta between ticks
 */
Enemy.prototype.update = function(dt) {
  // default enemy does not do much
};

/**
 * Mark enemy as 'hit'
 */
Enemy.prototype.hit = function() {
  this.hit_ = true;
};

/**
 * Mark enemy unhit
 */
Enemy.prototype.unhit = function() {
  this.hit_ = false;
};

/**
 * @return {boolean} - Is enemy hit?
 */
Enemy.prototype.isHit = function() {
  return this.hit_;
};

/**
 * @param {Enemy} other - check bboxes intersection 
 * Mark both self and other as hit if at least one pair of bboxes intersect.
 */
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

/**
 * Returns bounding boxes of the enemy - usually just one of them.
 * However, subclasses may add more as needed
 * @return {{left: number, top: nuber, right: number, bottom: number}}
 */
Enemy.prototype.bounding_boxes = function() {
  return [{left: this.x + this.rect_bounds.l,
           top:  this.y + this.rect_bounds.t,
           right: this.x + this.rect_bounds.r,
           bottom: this.y + this.rect_bounds.b}];
};

/** 
 * Debug-render - draw bbox(es) of the enemy if it is hit
 */
Enemy.prototype.debug_render = function() {
  var prevStrokeStyle = ctx.strokeStyle;
  if (this.isHit()) {
    ctx.strokeStyle = "red";
  } else {
    ctx.strokeStyle = "green";
  }

  var boxes = this.bounding_boxes();
  var i, l, box;
  for (i = 0, l = boxes.length; i < l; i++) {
    box = boxes[i];
    ctx.strokeRect(box.left, box.top,
                   box.right - box.left,
                   box.bottom - box.top);
  }
  ctx.strokeStyle = prevStrokeStyle;
};

/**
 * Draw the enemy on the screen, required method for game
 */
Enemy.prototype.render = function() {
  ctx.drawImage(this.sprite, this.x, this.y, this.w, this.h);
  this.debug_render();
};

/**
 * An enemy that re-enters the field from the other side
 * @constructor
 * @implements {Enemy}
 */
var WrappingEnemy = function () {
  Enemy.apply(this, arguments);
};

WrappingEnemy.prototype = Object.create(Enemy.prototype);
WrappingEnemy.prototype.constructor = WrappingEnemy;

/**
 * 
 */
WrappingEnemy.prototype.update = function(dt) {
  this.x += Math.floor(this.speed * dt);
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

/**
 * An enemy that bounces when hitting the edge of the field
 * @constructor
 * @implements {Enemy}
 */
var BouncingEnemy = function () {
  Enemy.apply(this, arguments);

  this.going_right = true;
};

BouncingEnemy.prototype = Object.create(Enemy.prototype);
BouncingEnemy.prototype.constructor = BouncingEnemy;

BouncingEnemy.prototype.update = function(dt) {
  var displacement = Math.floor(this.speed * dt);
  if (this.going_right) {
    this.x += displacement;
    if (this.x + this.rect_bounds.l > this.screen_bounds.w) {
      this.x = this.screen_bounds.w;
      this.going_right = false;
    }
  } else {
    this.x -= displacement;
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

/**
 * a Bouncing Enemy making sporadic decisions and changing directions
 * @constructor
 * @implements {BouncingEnemy}
 */
var DrunkEnemy = function () {
  BouncingEnemy.apply(this, arguments);
  this.ticks = 0;
};

DrunkEnemy.prototype = Object.create(BouncingEnemy.prototype);
DrunkEnemy.prototype.constructor = DrunkEnemy;

DrunkEnemy.prototype.update = function(dt) {
  this.ticks += dt;

  // change direction/speed spontaneously
  if (this.ticks > 2) {
    this.ticks -= 2;
    var chance = Math.floor(Math.random() * 3);
    if (chance == 0) {
      this.going_right = !this.going_right;
    } else if (chance == 1) {
      this.speed += 100;
      if (this.speed > 1000) {
        this.speed = 1000;
      }
    } else {
      this.speed -= 100;
      if (this.speed < 100) {
        this.speed = 100;
      }
    }
  }

  BouncingEnemy.prototype.update.call(this, dt);
};

/**
 * Player - our hero
 * @constructor
 * @implements {Enemy}
 */
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

  this.rect_bounds = {l: 18, t: 64, r: 83, b: 140};
  this.speed = 333;
};

Player.prototype = Object.create(Enemy.prototype);
Player.prototype.constructor = Player;

Player.prototype.update = function(dt) {
  var displacement = dt * this.speed;

  if (this.moves.left) {
    this.x -= displacement;
  }

  if (this.moves.right) {
    this.x += displacement;
  }

  if (this.moves.up) {
    this.y -= displacement;
  }

  if (this.moves.down) {
    this.y += displacement;
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

/**
 * Make sure that player stays within screen bounds 
 * 
 */
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

/**
 * keys to movements mappings
 */
Player.keys = {
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',

  // fps afficionados and lefties should not be left behind
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
