 /* global Phaser */
 var skGame = {
  w : 480,
  h : 480,
  score : 0,
  debug: false
 };

 if (window.location.search && window.location.search === "?debug") {
  skGame.debug = true;
 }

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
    
    // sprite sheets
    game.load.spritesheet('player', 'game/assets/skeleton-sprite-sheet.png', 70, 110);
    game.load.spritesheet('items' , 'game/assets/items.png', 60, 60);
    
    // static images
    game.load.image('heart', 'game/assets/heart.png');
    game.load.image('game_over', 'game/assets/game-over.png');
    game.load.image('start_screen', 'game/assets/start-screen.png');
    game.load.image('bg', 'game/assets/bg.png');

    // make more sounds here: http://www.bfxr.net/
    game.load.audio('pickup', 'game/assets/pickup.wav');
    game.load.audio('coin', 'game/assets/get_coin.wav');
    game.load.audio('hurt', 'game/assets/hurt.wav');
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
    var start = game.add.sprite(0, -1 * skGame.h, 'start_screen');
    game.add.tween(start).to({y: 0}, 1300, Phaser.Easing.Bounce.Out, true);
    // start bgmusic music here?
  },

  update: function() {
    if (this.cursor.left.isDown || this.cursor.right.isDown || game.input.mousePointer.isDown) {
      game.state.start('Play');
    }
  }
};

/****************************************************************************
  Game over
*/
skGame.Over = function (game) { };

skGame.Over.prototype = {
  create: function () {
    
    game.add.sprite(0, 0, 'bg');
    game.add.sprite(0, 0, 'game_over');

    this.cursor = game.input.keyboard.createCursorKeys();
    this.time = this.game.time.now + 800;
  },

  update: function() {
    if (this.game.time.now > this.time && (this.cursor.up.isDown || game.input.mousePointer.isDown)) {
      game.state.start('Play');
    }
  }
};

/****************************************************************************
  This is the actual game logic
*/
skGame.Play = function (game) { };

skGame.Play.prototype = {

  create: function () {
    var h = skGame.h, w = skGame.w, score = skGame.score;

    // add the background
    game.add.sprite(0, 0, 'bg');

    // initiate game physics
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.gravity.y = 200;
    game.physics.arcade.setBounds(0, 0, w, h - 29);

    // setup score
    score = 0;
    this.scoreText = game.add.text(10, 10, "0", { font: '30px Arial', fill: '#fff'});

    // inituate cursor key inputs
    this.cursor = game.input.keyboard.createCursorKeys();

    // create Group of items
    this.spawnItemTimer = 0;
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

    // shrink the bounding box of the player because there's some blank
    // space that allows collisions
    var heightOffset = 0;
    this.player.body.setSize(60, 110 + heightOffset, 0, 0 - heightOffset);

    //audio
    this.sounds = {};
    this.sounds.pickup = game.add.audio('pickup');
    this.sounds.coin = game.add.audio('coin');
    this.sounds.hurt = game.add.audio('hurt');

  },

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

    // game.onBlur.add(function() {
    //   console.log("BLURRED");
    // }, this);

    this.spawnItemTimer += this.time.elapsed;
    
    var timeArray = [500,800,1000,1200,1500,1800,2000];
    var num = rand(timeArray.length);
   
    // spawning an item every second
    if(this.spawnItemTimer > 1000) {
      this.spawnItemTimer = 0;
      this.spawnItem();
    }

    this.player.body.velocity.x = 0;

    // if player is hurt do this
    if (this.isHurt) {
      this.player.animations.play('hurt');
      if (this.game.time.now - this.hurtTime >= 500) {
        this.isHurt = false;
      }
    }

    // when player is moving
    if (this.cursor.left.isDown && !this.isHurt) {
      this.player.body.velocity.x = -350;
      this.player.animations.play('run');
      this.player.scale.x = 1;
    } else if (this.cursor.right.isDown && !this.isHurt) {
       this.player.body.velocity.x = 350;
       this.player.scale.x = -1;
       this.player.animations.play('run');
    } else if (!this.isHurt) {
      this.player.frame = 0;
    }

  },
  
  //http://gamedevelopment.tutsplus.com/tutorials/getting-started-with-phaser-building-monster-wants-candy--cms-21723
  spawnItem: function() {
    var h = skGame.h, w = skGame.w;
    
    // figure out how many columns available that are the width of the sprite
    var spriteW = 60; 
    var sp = Math.floor(w / spriteW); // calc number of columns in stage
    var dropPos = rand(sp); // get random column

    // now place it on screen by adding it to a group
    var item = game.add.sprite(dropPos * spriteW + (spriteW/2), 0, 'items');

    // get a random Item from the spritesheet 
    var itemType = rand(10);
    item.frame = itemType;
    if (itemType >= 9) {
      item.animations.add('spin', [9,10,11,12,13,14,15,16], 10, true);
      item.animations.play('spin');
    }

    game.physics.enable(item, Phaser.Physics.ARCADE);
    // shrink the bounding box of the item because there's some blank
    item.body.setSize(55, 60, 0, 0);

    game.physics.arcade.overlap(this.player, this.itemGroup, this.grabItem, null, this);
 
    item.anchor.setTo(0.5, 1);
    this.itemGroup.add(item);
  },

  grabItem: function(player, item) {
    var i = item._frame.index;

    if (i === 6 || i === 7  || i === 8) {
      this.reduceLife();
      this.isHurt = true;
      this.sounds.hurt.play('', 0, 0.2);
      this.hurtTime = this.game.time.now;
    } else if (i >= 9) {
      this.updateScore(500);
      this.sounds.coin.play('', 0, 0.2);
    } else {
      this.updateScore(100);
      this.sounds.pickup.play('', 0, 0.2);
    }

    item.kill();
  },

  showScoreOnHit: function(score) {
    var h = skGame.h, w = skGame.w;
    var x = this.player.position.x;
    var y = this.player.position.y;
    var myText = game.add.text(x, y, score , { font: '20px Arial', fill: '#fff' });
    game.add.tween(myText).to({y: h/2}, 600, Phaser.Easing.Linear.None, true);
    game.add.tween(myText).to({alpha: 0}, 600, Phaser.Easing.Linear.None, true);
  },
  
  updateScore: function (n) {
    if (!this.isHurt) {
      this.showScoreOnHit(n);
      skGame.score += n;
      this.scoreText.text = skGame.score;
    }
  },

  reduceLife: function(){
    this.health -= 1;
    if (this.health === 0) {
      game.state.start('Over');
    } else {
      var heart = this.heartGroup.getFirstExists(true);
      heart.kill();
    }
  }

};


var game = new Phaser.Game(skGame.w, skGame.h, Phaser.AUTO, 'skeletonGame');

game.state.add('Load', skGame.Load);
game.state.add('Intro', skGame.Intro);
game.state.add('Play', skGame.Play);
game.state.add('Over', skGame.Over);

game.state.start('Load');


