var X = X ||{};

X.GB = (function() {

  'use strict';
  
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

    step: function(debug) {

      X.PPU.step(X.CPU.step_one());

      if (debug)
        X.Debugger.update();
    },

    run: function() {

      for (var i = 0; i < 10000000; ++i) {

        this.step();

        if (X.Debugger.reached_breakpoint()) {
          X.Debugger.update();
          console.log('breakpoint');
          return;  
        }
      }

      X.Debugger.update();
      console.log('end'); 
    }

  };

})();
