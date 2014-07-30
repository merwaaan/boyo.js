var X = X ||{};

X.GB = (function() {

  'use strict';

  var paused = false;

  return {
  

    init: function() {
  
      // Initialize all modules
      
      X.Memory.init();
      X.CPU.init();
      X.PPU.init();
      X.Joypad.init();
      X.Debugger.init();
          
      this.reset();

      // Reset the console when a new game is inserted
      
      var gb = this;
      document.querySelector('input#rom').addEventListener('change', function() {
        
        var reader = new FileReader();
        reader.addEventListener('load', function() {

          var data = [];
          for (var i = 0; i < this.result.length; i++)
            data.push(this.result.charCodeAt(i));

          gb.reset();
          X.Cartridge.init(data);
        });

        reader.readAsBinaryString(this.files[0]);
      });
    },

    reset: function() {

      X.Memory.reset();
      X.CPU.reset();
      X.PPU.reset();
      X.Joypad.reset();
      X.Debugger.reset();
    },

    frame: function() {

      // Emulate until a V-Blank or a breakpoint occurs
      do {

        if (X.Debugger.reached_breakpoint()) {
          console.log('breakpoint!');
          X.Debugger.update();
          return;  
        }

      } while (!X.PPU.step(X.CPU.step()));

      // Repeat...
      if (!paused) {
        requestAnimationFrame(this.frame.bind(this));
      }
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

      this.frame();
    }

  };

})();
