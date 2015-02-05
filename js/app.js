/**
 * Generic Enemy (more like Entity but keeping the original name)
 * - it can render itself,
 * - collide with another 'enemy' and get hit
 * - update itself
 * @constructor
 * @param {number} x - initial x position of the enemy
 * @param {number} y - initial y position of the enemy
 * @param {string} filename - sprite to use
 */
var Enemy = function(x, y, filename) {
  // x and y are top-left corner of the sprite
  // default to (100, 100) if no values are given
  this.x = x || 100;
  this.y = y || 100;

  // The image/sprite to render
  this.sprite = Resources.get(filename || 'images/enemy-bug.png');

  // width and height - for rendering purposes
  this.w = this.sprite.width;
  this.h = this.sprite.height;

  // tight bounding box - used for collision detecting
  this.rectBounds = {
    left: 0,
    top: 76,
    right: this.w,
    bottom: this.h - 26
  };

  // screen bounds - used differently by each enemy type
  // some would bounce off or wrap around, etc
  this.screenBounds = {
    x: 0,
    y: 52,
    width: canvas.width,
    height: canvas.height - 20
  };

  // default enemy speed
  this.speed = 222;

  // @private - collision flag (used for player/enemy intersection)
  this.hit_ = false;
};

/**
 * a and b are rectangles (AABBs)
 * @param {{left: number, top: number, right: number, bottom: number}} a
 * @param {{left: number, top: number, right: number, bottom: number}} b
 * @return {boolean} if they intersect each other
 */
Enemy.rectsIntersect = function(a, b) {
  return !(a.right < b.left || b.right < a.left ||
           a.bottom < b.top || b.bottom < a.top);
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
 * Mark enemy as not 'hit'
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
 * @param {Enemy} other - check bounding boxes intersection
 * Mark both self and other as hit if at least one pair of boxes intersect.
 */
Enemy.prototype.collide = function(other) {
  var otherRects = other.boundingBoxes();
  var ownRects = this.boundingBoxes();

  for (var i = 0, l = ownRects.length; i < l; i++) {
    for (var j = 0, ol = otherRects.length; j < ol; j++) {
      if (Enemy.rectsIntersect(ownRects[i], otherRects[j])) {
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
 * @return {{left: number, top: number, right: number, bottom: number}}
 */
Enemy.prototype.boundingBoxes = function() {
  return [{
    left: this.x + this.rectBounds.left,
    top: this.y + this.rectBounds.top,
    right: this.x + this.rectBounds.right,
    bottom: this.y + this.rectBounds.bottom
  }];
};

/**
 * Debug-render - draw bbox(es) of the enemy if it is hit
 */
Enemy.prototype.debugRender = function() {
  var prevStrokeStyle = ctx.strokeStyle;
  ctx.strokeStyle = this.isHit() ? 'red' : 'green';

  var boxes = this.boundingBoxes();
  var i, l, box;
  for (i = 0, l = boxes.length; i < l; i++) {
    box = boxes[i];
    ctx.strokeRect(box.left,
                   box.top,
                   box.right - box.left,
                   box.bottom - box.top);
  }
  ctx.strokeStyle = prevStrokeStyle;
};

/**
 * Draw an enemy on the screen, required method for game
 */
Enemy.prototype.render = function() {
  ctx.drawImage(this.sprite, this.x, this.y, this.w, this.h);
};

/**
 * An enemy that re-enters the field from the other side
 * @constructor
 * @implements {Enemy}
 */
var WrappingEnemy = function() {
  Enemy.apply(this, arguments);
};

WrappingEnemy.prototype = Object.create(Enemy.prototype);
WrappingEnemy.prototype.constructor = WrappingEnemy;

/**
 * Move to the edge of the screen and start from the other side
 * @param {number} dt - a time delta between ticks
 */
WrappingEnemy.prototype.update = function(dt) {
  // move to the right with current speed
  this.x += Math.floor(this.speed * dt);

  // re-enter from the left if moved past the right edge of the screen
  if (this.x > this.screenBounds.width) {
    this.x = 0;
  }
};

/**
 * This one uses the default bounding box, but adds another one
 * when the enemy 'wraps' around to make sure that that part
 * can also 'hit' the player
 * @return {{left: number, top: number, right: number, bottom: number}}
 */
WrappingEnemy.prototype.boundingBoxes = function() {
  var boxes = Enemy.prototype.boundingBoxes.call(this);

  // calculate the invisible part of the enemy (if any)
  var wrapped = (this.x + this.rectBounds.right) - this.screenBounds.width;

  if (wrapped > 0) {
    boxes.push({
      left: 0,
      top: this.y + this.rectBounds.top,
      right: wrapped,
      bottom: this.y + this.rectBounds.bottom
    });
  }
  return boxes;
};

/**
 * Default render + the wrapped part
 */
WrappingEnemy.prototype.render = function() {
  // check if some part of the sprite is past the right edge of the screen
  var wrappedPart = (this.x + this.rectBounds.right) - this.screenBounds.width;

  // if it is - draw that part at the left edge
  if (wrappedPart > 0) {
    ctx.drawImage(this.sprite,
                  this.screenBounds.width - this.x, 0,
                  wrappedPart, this.sprite.height,
                  0, this.y,
                  wrappedPart, this.sprite.height);
  }

  // call 'super' for the rest of rending to take care of itself
  Enemy.prototype.render.call(this);
};

/**
 * An enemy that bounces when hitting the edge of the field
 * @constructor
 * @implements {Enemy}
 */
var BouncingEnemy = function() {
  Enemy.apply(this, arguments);

  // this type of enemy goes both directions
  // a simple boolean (right or left) flag would suffice
  this.goingRight = true;
};

BouncingEnemy.prototype = Object.create(Enemy.prototype);
BouncingEnemy.prototype.constructor = BouncingEnemy;

/**
 * Change direction when any edge of the screen is reached
 * @param {number} dt - a time delta between ticks
 */
BouncingEnemy.prototype.update = function(dt) {
  var displacement = Math.floor(this.speed * dt);

  // handle either direction:
  // try to move and then flip the directon if an edge was reached
  if (this.goingRight) {
    this.x += displacement;
    if (this.x + this.rectBounds.left > this.screenBounds.width) {
      this.x = this.screenBounds.width;
      this.goingRight = false;
    }
  } else {
    this.x -= displacement;
    if (this.x + this.rectBounds.right < 0) {
      this.x = -this.rectBounds.right;
      this.goingRight = true;
    }
  }
};

/**
 * Default render, but extra twist for mirroring the image
 * when moving to the left
 */
BouncingEnemy.prototype.render = function() {
  if (!this.goingRight) {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(this.sprite, -this.x, this.y, -this.w, this.h);
    ctx.restore();
  } else {
    Enemy.prototype.render.call(this);
  }
};

/**
 * a Bouncing Enemy making sporadic decisions and changing directions
 * @constructor
 * @implements {BouncingEnemy}
 */
var WildEnemy = function() {
  BouncingEnemy.apply(this, arguments);

  // @private - internal time used to trigger change of speed/direction
  this.time_ = 0;

  // @private - the quantum of speed change
  // used when speeding up/slowing down
  this.speedChange_ = 100;

  // @private - can't move any slower than this
  this.minSpeed_ = 100;

  // @private - max allowed speed
  this.maxSpeed_ = 1000;

  // @private - time (in seconds) when to change current state
  this.decisionTime_ = 2;
};

WildEnemy.prototype = Object.create(BouncingEnemy.prototype);
WildEnemy.prototype.constructor = WildEnemy;

/**
 * Every three frames the enemy tries to change either speed or direction
 * @param {number} dt - a time delta between ticks
 */
WildEnemy.prototype.update = function(dt) {
  this.time_ += dt;

  // change direction/speed spontaneously
  if (this.time_ > this.decisionTime_) {
    this.time_ -= this.decisionTime_;

    // do one of 3 things:
    // - change direction
    // - increase speed
    // - decrease speed
    var chance = Math.floor(Math.random() * 3);
    if (chance === 0) {
      // change direction
      this.goingRight = !this.goingRight;
    } else if (chance === 1) {
      // increase speed
      this.speed += this.speedChange_;
      if (this.speed > this.maxSpeed_) {
        this.speed = this.maxSpeed_;
      }
    } else {
      // decrease speed
      this.speed -= this.speedChange_;
      if (this.speed < this.minSpeed_) {
        this.speed = this.minSpeed_;
      }
    }
  }

  // let inherited logic take care of the rest
  BouncingEnemy.prototype.update.call(this, dt);
};

/**
 * Text object - zooms and slides away
 * @constructor
 * @param {string} text - string to show
 */
var Text = function(text) {
  // screen position
  this.x = 0;
  this.y = 45;

  // text itself
  this.text = text;

  // current size of the font
  this.size = 28;

  // maximum size of the font
  this.maxSize = 50;

  // movement speed (when sliding)
  this.speed = 70;

  // @private - internal state:
  // - 0 - zooming out
  // - 1 - sliding away
  // - 2 - dead
  this.state_ = 0;

  // screen width
  this.maxWidth = canvas.width;
};

/**
 * Render the text using current size and position
 */
Text.prototype.render = function() {
  var prevFont = ctx.font;

  ctx.font = this.size + 'px fantasy';
  var tm = ctx.measureText(this.text);
  ctx.fillText(this.text, (this.maxWidth - tm.width) / 2 + this.x, this.y);

  ctx.font = prevFont;
};

/**
 * Update text size or position (depending on the current state)
 * @param {number} dt - a time delta between ticks
 */
Text.prototype.update = function(dt) {
  if (this.state_ === 0 && this.size < this.maxSize) {
    // zoom out
    this.size += this.speed * dt;
    if (this.size > this.maxSize) {
      this.state_ = 1;
    }
  } else if (this.state_ === 1) {
    // slide
    this.x += 4 * this.speed * dt;
    if (this.x > this.maxWidth) {
      // die
      this.state_ = 2;
    }
  }
};

/**
 * @return {boolean} - is text 'alive' - i.e still visible
 */
Text.prototype.isAlive = function() {
  return this.state_ !== 2;
};

/**
 * Just like Text - but is used to show multiple phrases
 * @constructor
 * @implements {Text}
 * @param {Array.<string>} - strings to display one by one
 */
var MultiText = function(strings) {
  this.texts = strings.map(function(s) {
    return new Text(s);
  });

  this.idx = (this.texts.length < 1) ? -1 : 0;
};

/**
 * Render MultiText - that is render the current 'alive' text
 */
MultiText.prototype.render = function() {
  if (this.isAlive()) {
    this.texts[this.idx].render();
  }
};

/**
 * @return {boolean} - MultiText is alive if there's text to show
 */
MultiText.prototype.isAlive = function() {
  return (this.idx > -1 && this.idx < this.texts.length);
};

/**
 * Update the current text or move to the next one
 * @param {number} dt - a time delta between ticks
 */
MultiText.prototype.update = function(dt) {
  if (this.isAlive()) {
    var text = this.texts[this.idx];

    // update 'current' text or move to the next one
    if (text.isAlive()) {
      text.update(dt);
    } else {
      this.idx += 1;
    }
  }
};

/**
 * Time keeper object.
 * It keeps time, displays it and restarts the game when it's (hmm) time.
 * @constructor
 * @param {number} targetTime - how long until the end
 * @param {function()} fn - function to call when time is up
 */
var Chronos = function(targetTime, fn) {
  // @private - current time in seconds
  this.time_ = 0;

  // @private - the end of the line time
  this.targetTime_ = targetTime;

  // @private - hook to call
  this.fn_ = fn;
};

/**
 * Render time in upper-left corner
 */
Chronos.prototype.render = function() {
  var prevFont = ctx.font;
  var prevFillStyle = ctx.fillStyle;

  // red alert if time is running out (less than 30% left)
  if (this.redZone()) {
    ctx.fillStyle = 'red';
  }
  ctx.font = '20px fantasy';
  ctx.fillText(this.timeLeft().toFixed(2), 10, 27);

  // restore ctx state
  ctx.fillStyle = prevFillStyle;
  ctx.font = prevFont;
};

/**
 * @return {number} time left until callback will be called
 */
Chronos.prototype.timeLeft = function() {
  return this.targetTime_ - this.time_;
};

/**
 * @return {boolean} - if time is almost up (less than 30% left)
 */
Chronos.prototype.redZone = function() {
  return ((this.targetTime_ - this.time_) < (this.targetTime_ * 0.3));
};

/**
 * Update logic:
 * - increase passed time
 * - invoke callback if time has come for that
 * @param {number} dt - a time delta between ticks
 */
Chronos.prototype.update = function(dt) {
  this.time_ += dt;

  // call our hook function if the time has come
  if (!this.isAlive()) {
    this.fn_();
  }
};

/**
 * @return {boolean} - is there still time left?
 */
Chronos.prototype.isAlive = function() {
  return this.time_ < this.targetTime_;
};

/**
 * Bonus - is a collectible item which is supposed to modify
 * the state of the entity that 'caught' it.
 * @constructor
 * @implements {Enemy}
 * @param {number} x - horizontal coordinate of the bonus
 * @param {number} y - vertical coordinate of the bonus
 * @param {string} filename - sprite to use
 */
var Bonus = function(x, y, filename) {
  Enemy.call(this, x, y, filename || 'images/Star.png');

  // bounding box describing grabbable part of the image
  this.rectBounds = {
    left: 15,
    top: 66,
    right: this.w - 15,
    bottom: this.h - 35
  };

  // vertical speed
  this.speed = 100;

  // @private - bonus is alive until it is caught or flies off the screen
  this.alive_ = true;
};

Bonus.prototype = Object.create(Enemy.prototype);
Bonus.prototype.constructor = Bonus;

/**
 * Bonus update logic:
 * - slide down the screen (and die if reached the bottom)
 * - check if player picked us up
 * @param {number} dt - a time delta between ticks
 */
Bonus.prototype.update = function(dt) {
  this.y += this.speed * dt;

  // make sure bonus dies after falling off the screen
  if (this.y > this.screenBounds.height) {
    this.alive_ = false;
  }

  // check if player caught the bonus
  // TODO: refactor Enemy.collide to be able to re-use it
  var playerRects = player.boundingBoxes();
  var ownRects = this.boundingBoxes();

done:
  for (var i = 0, l = ownRects.length; i < l; i++) {
    for (var j = 0, ol = playerRects.length; j < ol; j++) {
      if (Enemy.rectsIntersect(ownRects[i], playerRects[j])) {
        this.applyBonus(player);
        break done;
      }
    }
  }
};

/**
 * Apply bonus to the object that presumably caught it
 * @param {Enemy} receiver - happy owner of the bonus
 */
Bonus.prototype.applyBonus = function(receiver) {
  // speed up the receiver
  receiver.speed *= 2;

  // die
  this.alive_ = false;
};

/**
 * @return {boolean} - is bonus still alive?
 */
Bonus.prototype.isAlive = function() {
  return this.alive_;
};

/**
 * Player - our hero
 * @constructor
 * @implements {Enemy}
 * @param {number} x - initial x position of the bonus
 * @param {number} y - initial y position of the bonus
 */
var Player = function(x, y) {
  Enemy.call(this, x, y, 'images/char-boy.png');

  // player input
  this.moves = {
    left: false,
    right: false,
    up: false,
    down: false
  };

  // use correct bounds for boy character
  this.rectBounds = {
    left: 18,
    top: 64,
    right: 83,
    bottom: 140
  };

  // player is a bit faster than enemies
  this.speed = 333;
};

Player.prototype = Object.create(Enemy.prototype);
Player.prototype.constructor = Player;

/**
 * Change position based on the input
 * and make sure that we stay on screen at all times
 * @param {number} dt - a time delta between ticks
 */
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

  this.forceScreenBounds();
};

/**
 * @return {boolean} - has our hero reached the goal?
 */
Player.prototype.reachedWater = function() {
  return this.y < -10;
};

/**
 * Make sure that player stays within screen bounds
 */
Player.prototype.forceScreenBounds = function() {
  if (this.x + this.rectBounds.left < this.screenBounds.x) {
    this.x = this.screenBounds.x - this.rectBounds.left;
  }

  if (this.x + this.rectBounds.right > this.screenBounds.width) {
    this.x = this.screenBounds.width - this.rectBounds.right;
  }

  if (this.y + this.rectBounds.top < this.screenBounds.y) {
    this.y = this.screenBounds.y - this.rectBounds.top;
  }

  if (this.y + this.rectBounds.bottom > this.screenBounds.height) {
    this.y = this.screenBounds.height - this.rectBounds.bottom;
  }
};

/**
 * Store the input in 'keypresses' table
 * @param {string} movement - one of 'left', 'up', 'right' or 'down'
   * @param {boolean} pressed - is it keypress or keyrelease
 */
Player.prototype.handleInput = function(movement, pressed) {
  this.moves[movement] = pressed;
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

// send keyup events to player
document.addEventListener('keyup', function(e) {
  if (player) {
    player.handleInput(Player.keys[e.keyCode], false);
  }
});

// send keydown events to player
document.addEventListener('keydown', function(e) {
  if (player) {
    player.handleInput(Player.keys[e.keyCode], true);
  }
});
