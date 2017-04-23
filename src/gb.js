var X = X ||{};

X.GB = (function() {

  'use strict';

  var stats;

  var last_frame_time = 0;
  var leftover_cycles = 0;
  var animation_frame;
  var lagging_frames = 0;

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

      // Stop running when tab has lost focus
      document.addEventListener("visibilitychange", function(ev) {
        if (document.hidden) {
          X.GB.pause()
        } else {
          X.GB.run()
        }
      });

      // FPS counter

      if (X.Constants.debug_fps_counter) {
        stats = new Stats();
        stats.setMode(0);

        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0';
        stats.domElement.style.right = '0';
        document.body.appendChild(stats.domElement);
      }
    },

    reset: function() {

      X.Memory.reset();
      X.CPU.reset();
      X.Video.reset();
      X.Audio.reset();
      X.Joypad.reset();
      X.Debugger.reset();

      leftover_cycles = 0;
      lagging_frames = 0;
    },

    frame: function(now) {
      // Compute time elapsed since the last frame
      var dt = Math.max(now - (last_frame_time || now), 0);
      last_frame_time = now;

      // How many cycles to emulate based on the elapsed time since the last
      // frame.  We add to keep track of the fractional part between calls.
      var gb_cycles = dt * X.Constants.cpu_freq / 1000;
      leftover_cycles += gb_cycles;

      if (X.Constants.debug_fps_counter) {
        stats.begin();
      }
      if (X.Constants.debug_frame_stats) {
        console.profile("frame");
      }
      var frame_cycles = 0;
      var before_emu = window.performance.now();

      // Emulate all leftover cycles or until a breakpoint has been reached
      while (leftover_cycles > 0) {
        if (X.Debugger.reached_breakpoint()) {
          this.running = false;
          X.Debugger.update();
          console.info('Break point reached');
          break;
        }

        var cycles = X.CPU.step();
        X.Audio.run(cycles);
        X.Video.step(cycles);

        leftover_cycles -= cycles;
        frame_cycles += cycles;
      }

      var emu_time = window.performance.now() - before_emu;
      var gb_time = frame_cycles / X.Constants.cpu_freq * 1000;

      if (X.Constants.debug_fps_counter) {
        stats.end();
      }
      if (X.Constants.debug_frame_stats) {
        console.profileEnd();

        console.group("Frame stats");
        console.log("Real time since last frame: %sms", dt.toPrecision(4));
        console.log("Cycles to emulate: %f", gb_cycles);
        console.log("Cycles emulated: %d", frame_cycles);
        console.log("GB time emulated: %sms", gb_time.toPrecision(4));
        console.log("Time spent: %sms", emu_time.toPrecision(4));
        console.groupEnd();
      }

      if (emu_time > gb_time) {
        lagging_frames++;
        if (lagging_frames >= 5) {
          console.warn("Can't keep up emulation, pausing emulator");
          X.GB.pause();
        }
      } else {
        lagging_frames = 0;
      }

      // Repeat...
      if (this.running)
        animation_frame = requestAnimationFrame(this.frame.bind(this));
    },

    run: function() {
      if (!this.running) {
        this.running = true;
        last_frame_time = window.performance.now();
        X.Audio.resume();
        animation_frame = requestAnimationFrame(this.frame.bind(this));
      }
    },

    pause: function() {
      if (this.running) {
        this.running = false;
        X.Audio.pause();
        if (animation_frame) {
          cancelAnimationFrame(animation_frame);
          animation_frame = null;
        }
      }
    },

    step: function() {
      X.Video.step(X.CPU.step());
      X.Debugger.update();
    },

  };

})();
