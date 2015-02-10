 /* global Phaser */
 var skGame = {
  w : 480,
  h : 480,
  score : 0
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
    
    game.load.spritesheet('player', 'game/assets/skeleton-sprite-sheet.png', 100, 120);
    game.load.spritesheet('items' , 'game/assets/items.png', 60, 60);
    game.load.image('heart', 'game/assets/heart.png');

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
    var label = game.add.text(skGame.w/2, skGame.h/2, 'Press Left or Right to begin', { font: '30px Arial', fill: '#fff' });
    label.anchor.setTo(0.5, 0.5);
    // start bgmusic music here?
  },

  update: function() {
    if (this.cursor.left.isDown || this.cursor.right.isDown)
      game.state.start('Play');
  }
};

/****************************************************************************
  Game over
*/
skGame.Over = function (game) { };

skGame.Over.prototype = {
  create: function () {
    var label = game.add.text(skGame.w/2, skGame.h/2, 'Game Over Man, press Up to start again', { font: '20px Arial', fill: '#fff' });
    label.anchor.setTo(0.5, 0.5);

    this.cursor = game.input.keyboard.createCursorKeys();
    this.time = this.game.time.now + 800;
  },

  update: function() {
    if (this.game.time.now > this.time && this.cursor.up.isDown) {
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

    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.gravity.y = 200;

    score = 0;
    this.cursor = game.input.keyboard.createCursorKeys();

    this.spawnItemTimer = 0;
    this.itemGroup = game.add.group();
    this.itemGroup.setAll('outOfBoundsKill', true);
    this.spawnItem();

    this.health = 3;
    this.heartGroup = game.add.group();
    var heart, i = 3, x = w - 30;
    while (i > 0) {
      heart = game.add.sprite(x, 10, 'heart');
      this.heartGroup.add(heart);
      x = x - 30;
      i--;
    }
    
    // add the player to the screen
    this.player = game.add.sprite(w/2, h, 'player');
    this.player.anchor.setTo(0.5,0);
    
    // setup animations
    this.player.animations.add('run', [1,2,3,4,5,6,7,8], 15, true);
    this.player.animations.add('hurt', [9,10], 15, true);
    this.isHurt = false;
    
    game.physics.arcade.enable(this.player);
    this.player.body.collideWorldBounds = true;

    //audio
    this.sounds = {};
    this.sounds.pickup = game.add.audio('pickup');
    this.sounds.coin = game.add.audio('coin');
    this.sounds.hurt = game.add.audio('hurt');

    this.scoreText = game.add.text(10, 10, "0", { font: '30px Arial', fill: '#fff'});
  },

  update: function() {
    var h = skGame.h, w = skGame.w, score = skGame.score;

    this.spawnItemTimer += this.time.elapsed;
    // spawning an item every second
    if(this.spawnItemTimer > 1000) {
      this.spawnItemTimer = 0;
      this.spawnItem();
    }

    this.player.body.velocity.x = 0;

    if (this.isHurt) {
      this.player.animations.play('hurt');
      if (this.game.time.now - this.hurtTime >= 500) {
        this.isHurt = false;
      }
    }

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

    if (this.game.time.now > this.itemTime) {
      this.itemTime = game.time.now + 250;
      var item = this.itemGroup.getFirstExists(false);
      if (item) {
        item.body.setSize(item.width, item.height, 0, 0);
        item.reset(rand(w/item.width-1)*item.width+7, -item.height);
        item.body.velocity.y = 300;
      }
    }

  },
  
  //http://gamedevelopment.tutsplus.com/tutorials/getting-started-with-phaser-building-monster-wants-candy--cms-21723
  spawnItem: function() {
    var h = skGame.h, w = skGame.w, score = skGame.score;
    
    // the X coordinate where this is dropping from
    var spriteW = 60;
    var sp = Math.floor(w / spriteW);
    var dropPos = rand(sp);

    // now place it on screen by adding it to a group
    var item = game.add.sprite(dropPos * spriteW + (spriteW/2), 0, 'items');

    // get a random Item from the spritesheet 
    var itemType = rand(10);
    item.frame = itemType;

    game.physics.enable(item, Phaser.Physics.ARCADE);
    game.physics.arcade.overlap(this.player, this.itemGroup, this.grabItem, null, this);
 
    item.anchor.setTo(0.5, 0.5);
    this.itemGroup.add(item);
  },

  grabItem: function(player, item) {

      switch(item._frame.index) {
        case 0:
          this.updateScore(5);
          this.sounds.coin.play('', 0, 0.2);
          break;
        case 7:
        case 8:
        case 9:
          this.reduceLife();
          this.isHurt = true;
          this.sounds.hurt.play('', 0, 0.2);
          this.hurtTime = this.game.time.now;
          break;
        default:
          this.updateScore(1);
          this.sounds.pickup.play('', 0, 0.2);
      }

      item.kill();
  },

  updateScore: function (n) {
    if (!this.isHurt) {
      skGame.score += n;
      this.scoreText.text = skGame.score;
    }
  },

  reduceLife: function(){
    this.health -= 1;
    if (this.health === 0) {
      this.clear();
      game.state.start('Over');
    } else {
      var heart = this.heartGroup.getFirstExists(true);
      heart.kill();
    }
  },

  clear: function() {
    this.health = 3;
  }

};


var game = new Phaser.Game(skGame.w, skGame.h, Phaser.AUTO, 'skeletonGame');

game.state.add('Load', skGame.Load);
game.state.add('Intro', skGame.Intro);
game.state.add('Play', skGame.Play);
game.state.add('Over', skGame.Over);

game.state.start('Load');


