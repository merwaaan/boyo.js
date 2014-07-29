var X = X ||{};

X.GB = (function() {

  'use strict';

  var paused = false;

  return {
  
    init: function() {

      X.CPU.init();
      X.PPU.init();
      X.Joypad.init();
      X.Debugger.init();

      X.Cartridge.init(game);

      //document.querySelector('input#rom').addEventListener('change', function() {});
    },

    /*step: function(steps, pause) {

      for (var i = 0; i < pause; ++i) {

        X.PPU.step(X.CPU.step_one());

        if (X.Debugger.reached_breakpoint()) {
          X.Debugger.update();
          console.log('breakpoint');
          return;  
        }
      } 

      if (steps - pause > 0) {
        setTimeout(function() { this.step(steps - pause, pause); }.bind(this), 0);
      }
      else {
        X.Debugger.update();
        console.log('end');
      }
    },*/

    frame: function() {

      // Emulate until a V-Blank occurs
      while (!X.PPU.step(X.CPU.step())) {}
      
      // Draw the frame on the canvas
      X.PPU.draw_frame();
      
      // Repeat...
      if (!paused)
        setTimeout(this.frame.bind(this), 0);
      else {
        X.Debugger.update();
        paused = false;
      }
    },

    pause: function() {

      paused = true;
    },

    step: function() {

      X.PPU.step(X.CPU.step());
      X.Debugger.update();
    },

    run: function() {

      setTimeout(this.frame.bind(this), 0);

      /*
        if (X.Debugger.reached_breakpoint()) {
          X.Debugger.update();
          console.log('breakpoint');
          return;  
        }
         */
    }

  };

})();
