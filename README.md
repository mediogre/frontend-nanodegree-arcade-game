Just run index.html either from local filesystem or hosted via any http servier.
The "game" would automatically run.
The goal is to control boy chacater and reach upper row (water) while avoiding any bugs.

The code was written following Google JavaScript Style (https://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml) and was checked with Closure Linter (https://developers.google.com/closure/utilities/docs/linter_howto).

This is more like a tech demo than a real game, however it does include everything that the rubric merits as Udacious:
- multiple enemy types exist (3 to be exact):
  - bouncing around bugs
  - wrapping around bugs
  - nervous ones (changing their direction and speed spontaneously)
- timed game (10 seconds are counting down and at 0 the game is reset)
- collectable bonus (makes the player twice as fast)
- animated text messages

JSDoc for comments is used extensively as suggested by Google JavaScript Style.
