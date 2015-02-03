var app = playground({

  width: 800,
  height: 500,
  preventKeyboardDefault: true,
  container: document.querySelector(".container"),

  step: function(delta) {
    
  },

  spriteX : 400, // starting sprite position
  movementSpeed : 5,
  render: function() {
    
    if (this.key === "left" && this.spriteX !== 0) {
      this.spriteX = this.spriteX - this.movementSpeed;
    }

    if (this.key === "right" && this.spriteX !== 770) {
      this.spriteX = this.spriteX + this.movementSpeed;
    }
    
    this.layer
      .clear("#ccc")
      .fillStyle("#fa0")
      .fillRect(this.spriteX, 440, 30, 50);


  },

  keydown: function(event) {
    this.key = event.key;
  },

});

//test