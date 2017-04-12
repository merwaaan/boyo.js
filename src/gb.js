var X = X ||{};

X.GB = (function() {

  'use strict';

  var stats;

  var prev_time;

  return {

    running: false,

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
          gb.reset();
          X.Cartridge.init(this.result);
          if (X.Cartridge.ready && !gb.running) gb.run();
        });

        reader.readAsArrayBuffer(this.files[0]);
      });

      var hosted_rom_select = document.querySelector('select#hosted_rom');
      hosted_rom_select.addEventListener('change', function(event) {

        var name = event.target.selectedOptions[0].textContent;

        var request = new XMLHttpRequest();
        request.open('GET', 'roms/' + name + '.gb', true);
        request.responseType = 'arraybuffer';

        request.onload = function() {
          gb.reset();
          X.Cartridge.init(request.response);
          if (X.Cartridge.ready && !gb.running) gb.run();
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

    frame: function(time) {

      stats.begin();

      // Emulate until a V-Blank or a breakpoint
      do {

        if (X.Debugger.reached_breakpoint()) {
          this.running = false;
          X.Debugger.update();
          console.info('Breakpoint reached');
          break;
        }

        var cycles = X.CPU.step();
        X.Audio.step(cycles);
        var vblank = X.Video.step(cycles);

      } while (!vblank && cycles > 0);

      stats.end();

      // Repeat...
      if (this.running)
        requestAnimationFrame(this.frame.bind(this));
    },

    run: function() {
      if (!this.running) {
        this.running = true;
        requestAnimationFrame(this.frame.bind(this));
      }
    },

    pause: function() {
      this.running = false;
    },

    step: function() {
      X.Video.step(X.CPU.step());
      X.Debugger.update();
    },

  };

})();
