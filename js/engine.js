/* Engine.js
 * This file provides the game loop functionality (update entities and render),
 * draws the initial game board on the screen, and then calls the update and
 * render methods on your player and enemy objects (defined in your app.js).
 *
 * A game engine works by drawing the entire game screen over and over, kind of
 * like a flipbook you may have created as a kid. When your player moves across
 * the screen, it may look like just that image/character is moving or being
 * drawn but that is not the case. What's really happening is the entire 'scene'
 * is being drawn over and over, presenting the illusion of animation.
 *
 * This engine is available globally via the Engine variable and it also makes
 * the canvas' context (ctx) object globally available to make writing app.js
 * a little simpler to work with.
 */

var Engine = (function(global) {
  /* Predefine the variables we'll be using within this scope,
   * create the canvas element, grab the 2D context for that canvas
   * set the canvas elements height/width and add it to the DOM.
   */
  var doc = global.document;
  var win = global.window;
  var canvas = doc.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var lastTime;

  // setting this to true would reset the game on the next frame
  var reset_request = false;

  // this parameter will be passed to reset function upon reset_request
  var reset_param;

  canvas.width = 505;
  canvas.height = 606;
  doc.body.appendChild(canvas);

  /**
   * This function is used to 'post a request' for resetting the game
   * @param {boolean} arg - the value that will be passed to reset
   */
  function request_reset(arg) {
    reset_request = true;
    reset_param   = arg;
  }

  /* This function serves as the kickoff point for the game loop itself
   * and handles properly calling the update and render methods.
   */
  function main() {
    if (reset_request) {
      reset(reset_param);

      // clean up reset "state"
      reset_request = false;
      reset_param   = null;
    }
    /* Get our time delta information which is required if your game
     * requires smooth animation. Because everyone's computer processes
     * instructions at different speeds we need a constant value that
     * would be the same for everyone (regardless of how fast their
     * computer is) - hurray time!
     */
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;

    /* Call our update/render functions, pass along the time delta to
     * our update function since it may be used for smooth animation.
     */
    update(dt);
    render();

    /* Set our lastTime variable which is used to determine the time delta
     * for the next time this function is called.
     */
    lastTime = now;

    /* Use the browser's requestAnimationFrame function to call this
     * function again as soon as the browser is able to draw another frame.
     */
    win.requestAnimationFrame(main);
  }

  /* This function does some initial setup that should only occur once,
   * particularly setting the lastTime variable that is required for the
   * game loop.
   */
  function init() {
    reset();
    lastTime = Date.now();
    main();
  }

  /* This function is called by main (our game loop) and itself calls all
   * of the functions which may need to update entity's data. Based on how
   * you implement your collision detection (when two entities occupy the
   * same space, for instance when your character should die), you may find
   * the need to add an additional function call here. For now, we've left
   * it commented out - you may or may not want to implement this
   * functionality this way (you could just implement collision detection
   * on the entities themselves within your app.js file).
   */
  function update(dt) {
    updateEntities(dt);
    checkCollisions();
  }

  function checkCollisions() {
    player.unhit();
    for (var i = 0, l = allEnemies.length; i < l; i++) {
      allEnemies[i].unhit();
      player.collide(allEnemies[i]);
    }
    // restart the game on failure
    if (player.isHit()) {
      request_reset(false);
    }
    // restart the game on success as well
    if (player.reachedWater()) {
      request_reset(true);
    }
  }

  /* This is called by the update function  and loops through all of the
   * objects within your allEnemies array as defined in app.js and calls
   * their update() methods. It will then call the update function for your
   * player object. These update methods should focus purely on updating
   * the data/properties related to  the object. Do your drawing in your
   * render methods.
   */
  function updateEntities(dt) {
    allEnemies.forEach(function(enemy) {
      enemy.update(dt);
    });
    player.update(dt);

    var survivors = [];
    critters.forEach(function(thing) {
      if (thing.isAlive()) {
        // keep this critter (for the next frame at least) if it's alive
        survivors.push(thing);
        // make sure it does its thing too
        thing.update(dt);
      }
    });
    critters = survivors;
  }

  /* This function initially draws the 'game level', it will then call
   * the renderEntities function. Remember, this function is called every
   * game tick (or loop of the game engine) because that's how games work -
   * they are flipbooks creating the illusion of animation but in reality
   * they are just drawing the entire screen over and over.
   */
  function render() {
    /* This array holds the relative URL to the image used
     * for that particular row of the game level.
     */
    var rowImages = [
      'images/water-block.png',   // Top row is water
      'images/stone-block.png',   // Row 1 of 3 of stone
      'images/stone-block.png',   // Row 2 of 3 of stone
      'images/stone-block.png',   // Row 3 of 3 of stone
      'images/grass-block.png',   // Row 1 of 2 of grass
      'images/grass-block.png'    // Row 2 of 2 of grass
    ];
    var numRows = 6;
    var numCols = 5;
    var row, col;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Loop through the number of rows and columns we've defined above
     * and, using the rowImages array, draw the correct image for that
     * portion of the 'grid'
     */
    for (row = 0; row < numRows; row++) {
      for (col = 0; col < numCols; col++) {
        /* The drawImage function of the canvas' context element
         * requires 3 parameters: the image to draw, the x coordinate
         * to start drawing and the y coordinate to start drawing.
         * We're using our Resources helpers to refer to our images
         * so that we get the benefits of caching these images, since
         * we're using them over and over.
         */
        ctx.drawImage(Resources.get(rowImages[row]), col * 101, row * 83);
      }
    }

    renderEntities();
  }

  /* This function is called by the render function and is called on each game
   * tick. It's purpose is to then call the render functions you have defined
   * on your enemy and player entities within app.js
   */
  function renderEntities() {
    /* Loop through all of the objects within the allEnemies array and call
     * the render function you have defined.
     */
    allEnemies.forEach(function(enemy) {
      enemy.render();
    });

    player.render();

    critters.forEach(function(thing) {
      thing.render();
    });
  }

  // y-values of rows - to make spawning of enemies 'easier'
  var rows = [-20, 60, 146, 226, 300, 405];

  // generate random integer between 0 and range-1
  function randomInt(range) {
    return Math.floor(Math.random() * range);
  }

  /**
   * Spawn a random type enemy at specified row
   */
  function randomEnemy(row) {
    var enemy_types = [WrappingEnemy, BouncingEnemy, WildEnemy];
    var enemy = enemy_types[randomInt(enemy_types.length)];
    var x = randomInt(canvas.width);
    return new enemy(x, rows[row]);
  }

  /* This function does nothing but it could have been a good place to
   * handle game reset states - maybe a new game menu or a game over screen
   * those sorts of things. It's only called once by the init() method.
   */
  function reset(success) {
    // create new enemies of random type
    allEnemies = [];
    for (var i = 0; i < 3; i += 1) {
      allEnemies.push(randomEnemy(i + 1));
    }
    // spawn new player
    player = new Player(202, rows[5]);

    // prepare instructive messages
    var messages = ['REACH', 'THAT', 'WATER'];
    if (success) {
      messages = ['CONGRATULATIONS!', 'NOW'].concat(messages);
    }

    // create critters
    critters = [
      new Chronos(10,
                  function() {
                    request_reset();
                  }),
      new MultiText(messages),
      new Bonus(100, 100)
    ];
   }

  /* Go ahead and load all of the images we know we're going to need to
   * draw our game level. Then set init as the callback method, so that when
   * all of these images are properly loaded our game will start.
   */
  Resources.load([
    'images/stone-block.png',
    'images/water-block.png',
    'images/grass-block.png',
    'images/enemy-bug.png',
    'images/char-boy.png',
    'images/Star.png'
  ]);
  Resources.onReady(init);

  /* Assign the canvas' context object to the global variable (the window
   * object wen run in a browser) so that developer's can use it more easily
   * from within their app.js files.
   */
  global.ctx = ctx;
  global.canvas = canvas;
})(this);
