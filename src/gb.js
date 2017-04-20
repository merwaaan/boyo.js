var X = X ||{};

X.GB = (function() {

  'use strict';

  var stats;

  var last_frame_time = 0;
  var leftover_cycles = 0;

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

      leftover_cycles = 0;
    },

    frame: function(now) {
      // Compute time elapsed since the last frame
      var dt = now - (last_frame_time || now);
      last_frame_time = now;

      // How many cycles to emulate based on the elapsed time since the last
      // frame.  We add to keep track of the fractional part between calls.
      leftover_cycles += dt * X.Constants.cpu_freq / 1000;

      stats.begin();

      // Emulate all leftover cycles or until a breakpoint has been reached
      do {
        if (X.Debugger.reached_breakpoint()) {
          this.running = false;
          X.Debugger.update();
          console.info('Breakpoint reached');
          break;
        }

        var cycles = X.CPU.step();
        X.Audio.run(cycles);
        X.Video.step(cycles);

        leftover_cycles -= cycles;
      } while (leftover_cycles > 0);

      stats.end();

      // Repeat...
      if (this.running)
        requestAnimationFrame(this.frame.bind(this));
    },

    run: function() {
      if (!this.running) {
        this.running = true;
        last_frame_time = window.performance.now();
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
