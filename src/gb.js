var X = X ||{};

X.GB = (function() {

  'use strict';

  var stats;

  var last_frame_time = 0;
  var leftover_cycles = 0;
  var animation_frame;
  var lagging_frames = 0;

  var toggle_button;
  var reset_button;

  return {

    // Whether the GB is powered on
    power: false,

    // Whether we are emulating the GB
    running: false,
    // Whether to resume from a tab switch
    was_running: false,

    init: function() {

      // Initialize all modules

      X.Memory.init();
      X.CPU.init();
      X.Video.init();
      X.Audio.init();
      X.Joypad.init();
      X.Debugger.init();

      // FPS counter

      if (X.Constants.debug_fps_counter) {
        stats = new Stats();
        stats.setMode(0);

        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0';
        stats.domElement.style.right = '0';
        document.body.appendChild(stats.domElement);
      }

      // When a cartridge is inserted, turn on the GB and start emulating

      var gb = this;

      function load_and_run(cartridge) {
        X.Cartridge.init(cartridge);
        gb.power = true;
        gb.reset();
        gb.resume();
      }

      // Setup listeners for ROM loading

      var local_rom_select = document.getElementById('local_rom');
      local_rom_select.selectedIndex = -1;
      local_rom_select.addEventListener('change', function() {
        var reader = new FileReader();
        reader.addEventListener('load', function() {
          load_and_run(this.result);
        });
        reader.readAsArrayBuffer(this.files[0]);
      });

      var hosted_rom_select = document.getElementById('hosted_rom');
      hosted_rom_select.addEventListener('change', function(event) {

        var name = event.target.selectedOptions[0].textContent;

        var request = new XMLHttpRequest();
        request.open('GET', 'roms/' + name + '.gb', true);
        request.responseType = 'arraybuffer';
        request.onload = function() {
          load_and_run(request.response)
        };
        request.send(null);
      });

      // Pause emulation when tab has lost focus
      document.addEventListener("visibilitychange", function(ev) {
        if (document.hidden) {
          gb.was_running = gb.running
          gb.pause()
        } else {
          if (gb.was_running) {
            gb.resume()
          }
        }
      });

      // Toggle the emulator state when the button is clicked
      toggle_button = document.getElementById('emulator-toggle');
      toggle_button.addEventListener('click', function() {
        if (gb.running) {
          gb.pause();
        } else {
          gb.resume();
        }
      });

      // A reset button is faster than reselecting the ROM
      reset_button = document.getElementById('gb-reset');
      reset_button.addEventListener('click', function() {
        gb.reset();
      });
    },

    // Pause emulation
    pause: function() {
      if (this.running) {
        this.running = false;

        // Cancel audio and video callbacks
        X.Audio.pause();
        if (animation_frame) {
          cancelAnimationFrame(animation_frame);
          animation_frame = null;
        }

        // Update toggle button
        toggle_button.textContent = "Resume";
      }
    },

    // Resume emulation
    resume: function() {
      if (!this.running) {
        this.running = true;

        // Plug back audio and video callbacks
        X.Audio.resume();
        last_frame_time = window.performance.now();
        animation_frame = requestAnimationFrame(this.frame.bind(this));

        // Update toggle button
        toggle_button.textContent = "Pause";
        toggle_button.disabled = false;
      }
    },

    // Clean up all state and restart emulation as if the GB had been powered
    // off and on.
    reset: function() {
      this.gb_power = false;

      X.Memory.reset();
      X.CPU.reset();
      X.Video.reset();
      X.Audio.reset();
      X.Joypad.reset();
      X.Debugger.reset();

      last_frame_time = 0;
      leftover_cycles = 0;
      lagging_frames = 0;

      this.gb_power = true;
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

    step: function() {
      X.Video.step(X.CPU.step());
      X.Debugger.update();
    },

  };

})();
