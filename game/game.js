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
    game.load.image('player', 'game/assets/player.png');
    game.load.image('item', 'game/assets/beads1.png');

    // game.load.audio('bgmusic', 'game/assets/ikoiko.wav');
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
  This is the actual game logid
*/
skGame.Play = function (game) { };

skGame.Play.prototype = {

  create: function () {
     var h = skGame.h, w = skGame.w, score = skGame.score;
    
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.gravity.y = 200;

    this.playerY = h - 100;
    score = 0;
    this.cursor = game.input.keyboard.createCursorKeys();

    this.spawnItemTimer = 0;
    this.itemGroup = game.add.group();
    this.itemGroup.setAll('outOfBoundsKill', true);
    this.spawnItem();
    
    this.player = game.add.sprite(w/2, this.playerY, 'player');
    game.physics.arcade.enable(this.player);
    this.player.body.collideWorldBounds = true;

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

    if (this.cursor.left.isDown) {
      this.player.body.velocity.x = -350;
    } else if (this.cursor.right.isDown) {
       this.player.body.velocity.x = 350;
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

    //game.physics.arcade.overlap(this.player, this.itemGroup, this.grabItem, null, this);
  },
  
  //http://gamedevelopment.tutsplus.com/tutorials/getting-started-with-phaser-building-monster-wants-candy--cms-21723
  spawnItem: function() {
    var h = skGame.h, w = skGame.w, score = skGame.score;
    var dropPos = Math.floor(Math.random()*w);
    var dropOffset = [-27,-36,-36,-38,-48];
    var itemType = Math.floor(Math.random()*5);
    var item = game.add.sprite(dropPos, dropOffset[itemType], 'item');
    
    game.physics.enable(item, Phaser.Physics.ARCADE);
    game.physics.arcade.overlap(this.player, this.itemGroup, this.grabItem, null, this);
 
    item.anchor.setTo(0.5, 0.5);
    this.itemGroup.add(item);
  },

  grabItem: function(player, item) {
      // play audio
      item.kill();
      this.updateScore(1);
  },

  updateScore: function (n) {
      skGame.score += n;
      this.scoreText.content = skGame.scorescore;
  },

  clear: function() {
  }

};




var game = new Phaser.Game(skGame.w, skGame.h, Phaser.AUTO, 'skeletonGame');

game.state.add('Load', skGame.Load);
game.state.add('Intro', skGame.Intro);
game.state.add('Play', skGame.Play);

game.state.start('Load');


