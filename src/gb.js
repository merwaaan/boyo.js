var X = X ||{};

X.GB = (function() {

  'use strict';

  var paused = false;

  var stats;

  return {

    init: function() {
  
      // Initialize all modules
      
      X.Memory.init();
      X.CPU.init();
      X.Video.init();
      X.Audio.init();
      X.Joypad.init();
      X.Debugger.init();

      // Reset the console when a game is inserted
      
      var gb = this;

      var local_rom_select = document.querySelector('input#local_rom');
      local_rom_select.selectedIndex = -1;
      local_rom_select.addEventListener('change', function() {
        
        var reader = new FileReader();
        reader.addEventListener('load', function() {

          var data = [];
          for (var i = 0; i < this.result.length; i++)
            data.push(this.result.charCodeAt(i));

          gb.reset();
          X.Cartridge.init(data);
          gb.frame();
        });

        reader.readAsBinaryString(this.files[0]);
      });

      var hosted_rom_select = document.querySelector('select#hosted_rom');
      hosted_rom_select.addEventListener('change', function(event) {
        
        var name = event.target.selectedOptions[0].textContent;

        var request = new XMLHttpRequest();
        request.open('GET', 'roms/' + name + '.gb', true);
        request.responseType = 'arraybuffer';

        request.onload = function() {
          gb.reset();
          X.Cartridge.init(new Uint8Array(request.response));
          gb.frame();
        };

        request.send(null);
      });

      // FPS counter

      stats = new Stats();
      stats.setMode(0);

      stats.domElement.style.position = 'absolute';
      stats.domElement.style.top = '0';
      stats.domElement.style.right = '0';
      document.body.appendChild(stats.domElement);
    },

    reset: function() {

      X.Memory.reset();
      X.CPU.reset();
      X.Video.reset();
      X.Audio.reset();
      X.Joypad.reset();
      X.Debugger.reset();
    },

    frame: function() {

      stats.begin();

      // Emulate until a V-Blank or a breakpoint
      do {

        if (X.Debugger.reached_breakpoint()) {
          console.log('breakpoint!');
          X.Debugger.update();
          return;  
        }

        var cycles = X.CPU.step();
        var vblank = X.Video.step(cycles);

      } while (!vblank && cycles > 0);

      stats.end();
      
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

      X.Video.step(X.CPU.step());
      X.Debugger.update();
    },

    run: function() {

      this.frame();
    }

  };

})();
