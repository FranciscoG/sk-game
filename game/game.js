/* global Phaser */
/*
  Grab Dem Beads!

  Skeleton Krewe mascot by Christopher Kirsch
  art: Manning Krull, http://www.manningkrull.com/
  programming & music: Francisco Gutierrez, http://www.franciscog.com/
  
  Made with Phaser HTML5 Game Framework - http://phaser.io/

  Background music was created with LSDJ on a modded Gameboy  
  Sound FX generated at: http://www.bfxr.net/ 
 */

 var skGame = {
  w : 480,
  h : 480,
  score : 0,
  debug: window.location.search === "?debug",
  isMobile: /Android|webOS|iPhone|iP[ao]d|Windows Phone/i.test(navigator.userAgent),
  isTouch: 'ontouchstart' in window || 'onmsgesturechange' in window
 };

function rand(num){ return Math.floor(Math.random() * num); }

/****************************************************************************
  On Page Load
*/

skGame.Load = function (game) {};

skGame.Load.prototype = {
  preload: function () {
    game.stage.backgroundColor = '#000';
    var label = game.add.text(skGame.w/2, skGame.h/2, 'loading...', { font: '30px Arial', fill: '#fff' });
    label.anchor.setTo(0.5, 0.5);

    // preload bar
    var startX = 160;
    var startY = (skGame.w/2) + 30;
    this.preloadBar = game.add.graphics(startX, startY);
    this.preloadBar.lineStyle(10, 0xffffff, 1);
    this.preloadBar.moveTo(0, 0);
    this.preloadBar.lineTo(startX, 0);
    this.preloadBar.scale.x = 0; // set the bar to the beginning position

    // scale game for smaller than 480px
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.scale.setScreenSize(true);
    
    // sprite sheets
    game.load.spritesheet('player', 'game/assets/skeleton-sprite-sheet.png', 70, 110);
    game.load.spritesheet('items' , 'game/assets/items.png', 60, 60);
    game.load.spritesheet('dying' , 'game/assets/skeleton-dying-sprite.png', 130, 120);
    
    // static images
    game.load.image('heart', 'game/assets/heart.png');
    game.load.image('game_over', 'game/assets/game-over.png');
    game.load.image('start_screen', 'game/assets/start-screen.png');
    game.load.image('bg', 'game/assets/bg.png');

    // load audio
    game.load.audio('pickup', 'game/assets/pickup.wav');
    game.load.audio('coin', 'game/assets/get_coin.wav');
    game.load.audio('hurt', 'game/assets/hurt.wav');
    game.load.audio('necklace', 'game/assets/necklace.wav');
    game.load.audio('iko', 'game/assets/iko.mp3');

  },

  loadUpdate: function () {
    // every frame during loading, set the scale.x of the bar to the progress (an integer between 0
    // and 100) divided by 100 to give a float between 0 and 1
    this.preloadBar.scale.x = game.load.progress * 0.01;
  },

  create: function () {
    game.state.start('Intro');
  }
};

/****************************************************************************
  When all assets are loaded it goes here
*/
skGame.Intro = function (game) { };

skGame.Intro.prototype = {
  create: function () {
    this.cursor = game.input.keyboard.createCursorKeys();
    
    // bring in the start streen from the top and make it bounce
    var start = game.add.sprite(0, -1 * skGame.h, 'start_screen');
    game.add.tween(start).to({y: 0}, 1300, Phaser.Easing.Bounce.Out, true);
    
    // main bg audio
    skGame.iko = game.add.audio('iko');
    skGame.iko.play('', 0, 0.2, true);

    // init mute key
    skGame.mute();

  },

  update: function() {
    if (this.cursor.left.isDown || this.cursor.right.isDown || game.input.pointer1.isDown || game.input.mousePointer.isDown) {
      game.state.start('Play');
    }
  }
};

/****************************************************************************
  Game over
*/
skGame.Over = function (game) { };

skGame.Over.prototype = {
  init: function(player){
    this.player = player;
  },

  create: function () {

    game.add.sprite(0, 0, 'bg');
    game.add.sprite(0, 0, 'game_over');

    // position and play the dying sprite animation
    var posX = this.player.position.x - 18;
    var posY = skGame.h - (120 + 29);
    var dead = game.add.sprite(posX, posY, 'dying');
    dead.scale.x = this.player.scale.x;
    dead.animations.add('death', [0,8,0,8,0,1,2,3,4,5,6,7], 20, false).play();

    // setup keyboard input capture with a short time delay
    this.cursor = game.input.keyboard.createCursorKeys();
    this.time = this.game.time.now + 800;

    // init mute key
    skGame.mute();

    // placing the score in the game overscreen as well
    game.add.text(10, 10, skGame.score, { font: '30px Arial', fill: '#fff'});
  },

  update: function() {
    if (this.game.time.now > this.time && (this.cursor.up.isDown || game.input.mousePointer.isDown || game.input.pointer1.isDown)) {
      game.state.start('Play');
    }
  }
};

/****************************************************************************
  Handle Muting Background music in all states
*/

skGame.muteStatus = false;
skGame.mute = function(){
  this.muteKey = game.input.keyboard.addKey(Phaser.Keyboard.M);
  this.muteKey.onDown.add(skGame.muteFunction, this);
};

skGame.muteFunction = function(){
  if (this.muteKey.isDown && !skGame.muteStatus) {
    skGame.iko.pause();
    skGame.muteStatus = true;
  } else if (this.muteKey.isDown && skGame.muteStatus) {
    skGame.iko.resume();
    skGame.muteStatus = false;
  }
};

/****************************************************************************
  This is the actual game logic
*/
skGame.Play = function (game) { };

skGame.Play.prototype = {

  create: function () {
    var h = skGame.h, w = skGame.w;

    // add the background
    game.add.sprite(0, 0, 'bg');

    // initiate game physics
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.gravity.y = 200;
    game.physics.arcade.setBounds(0, 0, w, h - 29);

    // setup score
    skGame.score = 0;
    this.scoreText = game.add.text(10, 10, "0", { font: '30px Arial', fill: '#fff'});

    // inituate cursor key inputs
    this.cursor = game.input.keyboard.createCursorKeys();

    // create Group of items
    //this.spawnItemTimer = 0;
    this.itemGroup = game.add.group();
    this.itemGroup.setAll('outOfBoundsKill', true);
    this.spawnItem();

    // add hearts to screen
    this.health = 3;
    this.heartGroup = game.add.group();
    var heart,
        i = this.health,
        x = w - 40;
    while (i > 0) {
      heart = game.add.sprite(x, 10, 'heart');
      this.heartGroup.add(heart);
      x = x - 35;
      i--;
    }
    
    // add the player to the screen
    this.player = game.add.sprite(w/2, h - 30, 'player');
    this.player.anchor.setTo(0.5,0);
    
    // setup player
    this.player.animations.add('run', [1,2,3,4,5,6,7,8], 15, true);
    this.player.animations.add('hurt', [9,10], 15, true);
    this.isHurt = false;
    game.physics.arcade.enable(this.player);
    this.player.body.collideWorldBounds = true;

    // shrink the bounding box of the player because there's some transparent
    // space that allows collisions
    var heightOffset = 0; // messing around with the height to see if it affected collision
    this.player.body.setSize(60, 110 + heightOffset, 0, 0 - heightOffset);

    //audio
    this.sounds = {};
    // sound FX
    this.sounds.pickup = game.add.audio('pickup');
    this.sounds.coin = game.add.audio('coin');
    this.sounds.hurt = game.add.audio('hurt');
    this.sounds.necklace = game.add.audio('necklace');

    // create spawnItem loop
    this.looping = game.time.events.loop(1000, this.spawnItem, this);

    // init mute key
    skGame.mute();
    
    // show item paths in debug mode
    this.showColumns();
  },

  // only used for debugging
  showColumns: function(){
    if (skGame.debug) {
      var spriteW = 60;
      var totalColumns = Math.floor(skGame.w / spriteW); // calc number of columns in stage
      var currCol = 0;
      var col;

      while(totalColumns > 0){
        // show columns
        col = game.add.graphics(currCol, 0);
        col.lineStyle(10, 0xffffff, 0.4);
        col.moveTo(0, 0);
        col.lineTo(0, skGame.h);
        currCol += spriteW;
        totalColumns--;
      }
      col = null;
    }
  },

  // eveything in this render function is only used during debug
  render: function() {
    function renderGroup(member) {
      game.debug.body(member, 'rgba(255, 255, 255, 0.4)');
    }
    
    if (skGame.debug) {
      game.debug.body(this.player, 'rgba(255, 255, 255, 0.4)');
      this.itemGroup.forEachAlive(renderGroup, this);
    }
  },

  update: function() {
    var h = skGame.h, w = skGame.w, score = skGame.score;

    // rotate the item
    this.itemGroup.forEachAlive(function(item){
        item.angle += item.rotateMe || 0;
    });
    
    this.player.body.velocity.x = 0;

    // if player is hurt do this
    if (this.isHurt) {
      this.player.animations.play('hurt');
      if (this.game.time.now - this.hurtTime >= 500) {
        this.isHurt = false;
      }
    }

    // when player is moving
    if (!this.isHurt){
      this.movePlayer();
    }

  },

  /**
   * Moves this.player sprite. Called from the Play.update function
   * handles both touch and cursor
   * @return {undefined}
   */
  movePlayer: function(){
    var RIGHT = 1, LEFT = 0;
    
    this.player.animations.play('run');

    function moveLeft(context, vel){
      var v = vel || -350;
      context.player.body.velocity.x = v;
      context.player.scale.x = 1;
    }
    
    function moveRight(context, vel){
      var v = vel || 350;
      context.player.body.velocity.x = v;
      context.player.scale.x = -1;
    }

    if (game.input.pointer1.isDown){
      if (Math.floor(game.input.x/(game.width/2)) === LEFT) {
        moveLeft(this);
      }
   
      if (Math.floor(game.input.x/(game.width/2)) === RIGHT) {
        moveRight(this);
      }
    
    } else if (this.cursor.left.isDown){
      moveLeft(this);
    } else if (this.cursor.right.isDown) {
      moveRight(this);
    } else {
      this.player.animations.stop();
      this.player.frame = 0;
    }
  },
  
  /**
   * Handles spawning random items
   * @return {undefined}
   */
  spawnItem: function() {
    var h = skGame.h, w = skGame.w;

    // I want the items to fall in specific columns on the screen so first I need to
    // figure out how many columns available that are the width of the sprite
    var spriteW = 60;
    var sp = Math.floor(w / spriteW); // calc number of columns in stage
    var dropPos = rand(sp); // get random column

    // now place it on screen by adding it to a group
    var itemX = dropPos * spriteW + (spriteW/2);
    var item = game.add.sprite(itemX, 0, 'items', null, this.itemGroup);

    // get a random Item from the spritesheet. 11 items total
    var itemType = rand(11);
    if (itemType === 10) {
      item.animations.add('blink', [17,18], 10, true);
      item.animations.play('blink');
      item.itemName = "necklace";
    } else if (itemType === 9) {
      item.animations.add('coin_twirl', [9,10,11,12,13,14,15,16], 10, true);
      item.animations.play('coin_twirl');
      item.itemName = "coin";
    } else if (itemType <= 5 ) {
      item.itemName = "normal_item";
      item.frame = itemType;
    } else { // items 6,7,8
      item.itemName = "bad_item";
      item.frame = itemType;
    }
    item.rotateMe = (Math.random()*4)-2;

    // enable physics
    game.physics.enable(item, Phaser.Physics.ARCADE);
    
    // shrink the bounding box of the item because there's some transparent area
    item.body.setSize(55, 60, 0, 0);
    item.anchor.setTo(0.5, 0.5);
    game.physics.arcade.overlap(this.player, this.itemGroup, this.grabItem, null, this);
  },

  /**
   * Callback function for player overlap collision with an item
   * @param  {object} player 
   * @param  {object} item   specific item collided with
   * @return {undefined}
   */
  grabItem: function(player, item) {
    item.kill();

    var self = this;
    var actions = {
      "normal_item" : function() {
        self.updateScore(100);
        self.sounds.pickup.play('', 0, 0.2);
      },
      "coin" : function() {
        self.updateScore(500);
        self.sounds.coin.play('', 0, 0.2);
      },
      "necklace" : function() {
        self.updateScore(1000);
        self.sounds.necklace.play('', 0, 0.2);
      },
      "bad_item" : function() {
        self.reduceLife();
        self.isHurt = true;
        self.sounds.hurt.play('', 0, 0.2);
        self.hurtTime = self.game.time.now;
      }
    };

    actions[item.itemName]();
  },

  /**
   * displays the score of the item collided with above the player's head and 
   * makes it float up and fade away
   * @param  {number} score
   * @return {undefined}
   */
  showScoreOnHit: function(score) {
    var h = skGame.h, w = skGame.w;
    var x = this.player.position.x;
    var y = this.player.position.y;
    var myText = game.add.text(x, y, score , { font: '20px Arial', fill: '#fff' });
    game.add.tween(myText).to({y: h/2}, 600, Phaser.Easing.Linear.None, true);
    game.add.tween(myText).to({alpha: 0}, 600, Phaser.Easing.Linear.None, true);
  },
  
  /**
   * updates the score on screen
   * @param  {number} n 
   * @return {undefined}
   */
  updateScore: function (n) {
    if (!this.isHurt) {
      this.showScoreOnHit(n);
      skGame.score += n;
      this.scoreText.text = skGame.score;
    }
  },

  /**
   * reduces player health by 1, switches state to 'Over' is health is 0
   * @return {undefined}
   */
  reduceLife: function(){
    this.health -= 1;
    if (this.health === 0) {
      game.state.start('Over',true,false, this.player);
    } else {
      var heart = this.heartGroup.getFirstExists(true);
      heart.kill();
    }
  }

};


var game = new Phaser.Game(skGame.w, skGame.h, Phaser.CANVAS, 'skeletonGame');

game.state.add('Load', skGame.Load);
game.state.add('Intro', skGame.Intro);
game.state.add('Play', skGame.Play);
game.state.add('Over', skGame.Over);

game.state.start('Load');


