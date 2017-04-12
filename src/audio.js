/* global console */

/* Reference material:
 * - http://gbdev.gg8.se/wiki/articles/Gameboy_sound_hardware
 * - http://problemkaputt.de/pandocs.htm#soundcontroller
 */

var X = X || {};

X.Audio = (function() {

  'use strict';

  // function DutyCycle(pattern) {
  //   this.timer = new Counter((2048 - 0) * 4);
  //   this.pattern = pattern;
  //   this.counter = new Counter(7);

  //   this.timer.attach(this.counter.clock.bind(this.counter));
  // }

  // DutyCycle.prototype.clock = function() {
  //   this.timer.clock();
  // };

  // DutyCycle.prototype.output = function () {
  //   return duty_cycles[this.pattern][this.counter.output()];
  // };

  // function LengthCounter() {
  //   this.timer = new Counter(GB_FREQ / 256);
  //   this.down_counter = new Counter(0, false);
  //   this.disabled = 0;

  //   this.timer.attach(this.down_counter.clock.bind(this.down_counter));
  // }

  // LengthCounter.prototype.set_counter = function(value) {
  //   if (value < 0) {
  //     console.warn('in LengthCounter.set_counter: negative counter');
  //     value = 0;
  //   }

  //   this.down_counter.counter = value;
  // };

  // LengthCounter.prototype.get_counter = function() {
  //   return this.down_counter.counter;
  // };

  // LengthCounter.prototype.clock = function() {
  //   if (this.disabled === 0) {
  //     this.timer.clock();

  //     if (this.down_counter.counter === 0) {
  //       this.disabled = 1;
  //     }
  //   }
  // };

  // LengthCounter.prototype.output = function() {
  //   return this.down_counter.counter > 0 ? 1 : 0;
  // };

  // function Envelope() {
  //   this.timer = new Counter(GB_FREQ / 64);
  //   this.step_length_counter = new Counter(7);
  //   this.volume = 0;
  //   this.volume_direction = 0;

  //   this.timer.attach(this.step_length_counter.clock.bind(this.step_length_counter));
  //   this.step_length_counter.attach(this.change_volume.bind(this));
  // }

  // Envelope.prototype.clock = function() {
  //   this.timer.clock();
  // };

  // Envelope.prototype.change_volume = function() {
  //   if (this.volume_direction === 0 && this.volume > 0) {
  //     --this.volume;
  //   }

  //   else if (this.volume_direction === 1 && this.volume < 16) {
  //     ++this.volume;
  //   }
  // };

  // Envelope.prototype.output = function() {
  //   return this.volume;
  // };

  // function Square() {
  //   this.duty_cycle = new DutyCycle(2);
  //   this.length_counter = new LengthCounter();
  //   this.envelope = new Envelope();
  // }

  // Square.prototype.init = function() {

  // };

  // Square.prototype.output = function() {
  //   if (this.length_counter.disabled === 1) {
  //     return 0;
  //   }

  //   var out = this.duty_cycle.output();
  //   out = out & this.length_counter.output();
  //   out *= this.envelope.output();
  //   out /= 15;
  //   out *= 0.5; // final dampening to avoid distortion

  //   return out;
  // };

  // Square.prototype.clock = function() {
  //   this.duty_cycle.clock();
  //   this.length_counter.clock();
  //   this.envelope.clock();
  // };

  // Square.prototype.w_nrx0 = function(value) {
  //   // this.sweep.period = (value >> 4) & 0xf;
  //   // this.sweep.negate = (value >> 3) & 0x1;
  //   // this.sweep.shift = value & 0x7;
  // };

  // Square.prototype.w_nrx1 = function(value) {
  //   this.duty_cycle.pattern = value >> 6;
  //   this.length_counter.set_counter(64 - (value & 0x3f));
  // };

  // Square.prototype.w_nrx2 = function(value) {
  //   this.envelope_start_volume = value >> 4;
  //   this.envelope_volume_direction = (value >> 3) & 0x1;
  //   this.envelope_step_length = value & 0x7;

  //   if (this.envelope_step_length === 0) {
  //     this.envelope_step_length = 8;
  //   }
  // };

  // Square.prototype.w_nrx3 = function(value) {
  //   this.freq = value | (this.freq & 0x700);
  // };

  // Square.prototype.w_nrx4 = function(value) {
  //   this.freq = ((value & 0x7) << 8) | (this.freq & 0xff);
  //   this.length_counter.disabled = (value >> 6) & 0x1;
  //   this.trigger = (value >> 7) & 0x1;

  //   if (this.trigger === 1) {
  //     this.length_counter.disabled = 0;
  //     if (this.length_counter.get_counter() === 0) {
  //       this.length_counter.set_counter(0x3f);
  //     }

  //     this.duty_cycle.timer.set_period((2048 - this.freq) * 4);

  //     this.envelope.volume = this.envelope_start_volume;
  //     this.envelope.volume_direction = this.envelope_volume_direction;
  //     this.envelope.step_length_counter.set_period(this.envelope_step_length);
  //   }
  // };

  // function WavePlayback() {
  //   this.timer = new Counter((2048 - 0) * 2);
  //   this.position_counter = new Counter(31);

  //   this.timer.attach(this.position_counter.clock.bind(this.position_counter));
  // }

  // WavePlayback.prototype.clock = function() {
  //   this.timer.clock();
  // };

  // WavePlayback.prototype.output = function() {
  //   var byt = ram[Math.floor(this.position_counter.counter / 2)];
  //   var nibble = (byt >> (4 * (1 - (this.position_counter.counter % 2)))) & 0xf;
  //   var sample = nibble / 0xf;

  //   return sample;
  // };

  // function Wave() {
  //   this.length_counter = new LengthCounter();
  //   this.wave_playback = new WavePlayback();
  // }

  // Wave.prototype.init = function() {

  // };

  // Wave.prototype.clock = function() {
  //   this.length_counter.clock();
  //   this.wave_playback.clock();
  // };

  // Wave.prototype.output = function() {
  //   if (this.enabled === 0) {
  //     return 0;
  //   }

  //   var out = this.wave_playback.output();
  //   if (this.length_counter.output() === 0) {
  //     out = 0;
  //   }

  //   switch (this.volume_code) {
  //     case 0: out = 0; break;
  //     case 1: break;
  //     case 2: out = out >> 1; break;
  //     case 3: out = out >> 2; break;
  //   }

  //   out /= 15;
  //   out *= 2; // gives some boost

  //   return out;
  // };

  // Wave.prototype.w_nrx0 = function(value) {
  //   this.enabled = (value >> 7) & 0x1;
  // };

  // Wave.prototype.w_nrx1 = function(value) {
  //   this.length_counter.set_counter(256 - (value & 0xff));
  // };

  // Wave.prototype.w_nrx2 = function(value) {
  //   this.volume_code = (value >> 5) & 0x3;
  // };

  // Wave.prototype.w_nrx3 = Square.prototype.w_nrx3;

  // Wave.prototype.w_nrx4 = function(value) {
  //   this.trigger = (value >> 7) & 0x1;
  //   this.length_counter.disabled = (value >> 6) & 0x1;
  //   this.freq = ((value & 0x7) << 8) | (this.freq & 0xff);

  //   if (this.trigger) {
  //     this.length_counter.disabled = 0;
  //     if (this.length_counter.get_counter() === 0) {
  //       this.length_counter.set_counter(0xff);
  //     }

  //     this.wave_playback.timer.set_period((2048 - this.freq) * 2);

  //     this.wave_playback.position_counter.counter = 31;
  //   }
  // };

  // function PRNG() {
  //   this.timer = new Counter(2000);
  //   this.timer.attach(this.lfsr.bind(this));
  //   this.shift_register = 0xff;
  //   this.width_mode = 0;
  // }

  // PRNG.prototype.clock = function() {
  //   this.timer.clock();
  // };

  // PRNG.prototype.lfsr = function() {
  //   var bit0 = this.shift_register & 0x1;
  //   this.shift_register >>>= 1;
  //   var bit1 = this.shift_register & 0x1;
  //   var xor = bit0 ^ bit1;
  //   this.shift_register = xor << 0xf | this.shift_register;

  //   if (this.width_mode === 1) {
  //     this.shift_register = xor << 0x6 | this.shift_register;
  //   }
  // };

  // PRNG.prototype.output = function() {
  //   return ~(this.shift_register & 0x1);
  // };

  // function Noise() {
  //   this.prng = new PRNG();
  //   this.length_counter = new LengthCounter();
  //   this.envelope = new Envelope();

  //   this.clock_shift = 0;
  //   this.divisor_code = 0;
  // }

  // Noise.prototype.init = function() {
  // };

  // Noise.prototype.clock = function() {
  //   this.prng.clock();
  //   this.length_counter.clock();
  //   this.envelope.clock();
  // };

  // Noise.prototype.output = function() {
  //   var out = this.prng.output();
  //   out = out & this.length_counter.output();
  //   out *= this.envelope.output();
  //   out /= 15;
  //   out *= 0.5; // final dampening to avoid distortion

  //   return out;
  // };

  // Noise.prototype.w_nrx1 = function(value) {
  //   this.length_counter.set_counter(64 - (value & 0x3f));
  // };

  // Noise.prototype.w_nrx2 = Square.prototype.w_nrx2;

  // Noise.prototype.w_nrx3 = function(value) {
  //   this.clock_shift = value >> 4;
  //   this.prng.width_mode = (value >> 3) & 0x1;
  //   this.divisor_code = value & 0x7;
  // };

  // Noise.prototype.w_nrx4 = function(value) {
  //   this.trigger = (value >> 7) & 0x1;
  //   this.length_counter.disabled = (value >> 6) & 0x1;

  //   if (this.trigger) {
  //     this.length_counter.disabled = 0;
  //     if (this.length_counter.counter === 0) {
  //       this.length_counter.counter = 0x3f;
  //     }

  //     var r = this.divisor_code === 0 ? 0.5 : this.divisor_code;
  //     var base = 16 * r;
  //     this.prng.timer.set_period(base << this.clock_shift);

  //     this.prng.shift_register = 0xff;

  //     this.envelope.volume = this.envelope_start_volume;
  //     this.envelope.volume_direction = this.envelope_volume_direction;
  //     this.envelope.step_length_counter.set_period(this.envelope_step_length);
  //   }
  // };

  // var sq1 = new Square();
  // var sq2 = new Square();
  // var wav = new Wave();
  // var noise = new Noise();

  // var control = {
  //   left_vol: 0,
  //   right_vol: 0
  // };


  var duty_cycles = [
    [0,0,0,0,1,0,0,0],
    [0,0,0,0,1,1,0,0],
    [0,0,1,1,1,1,0,0],
    [1,1,1,1,0,0,1,1]
  ];

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Pulse
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  function Pulse() {
    this.enabled = false
    this.dac_enabled = false
    this.period = 0
    this.frequency = 0
    this.duty = 2
    this.duty_idx = 0
    this.length_counter = 0
    this.volume = 0
    this.volume_init = 0
    this.volume_counter = 0
    this.volume_period = 0
    this.volume_sweep = 0
  }

  Pulse.prototype.is_enabled = function() {
    return this.enabled
  }

  Pulse.prototype.is_dac_enabled = function() {
    return this.dac_enabled
  }

  Pulse.prototype.read = function(addr) {
    switch (addr) {
      // NR10
    case 0xff10:
      return 0

      // NR11 | NR21
    case 0xff11:
    case 0xff16:
      return this.duty << 6

      // NR12 | NR22
    case 0xff12:
    case 0xff17:
      return this.volume_init << 4
        | this.volume_sweep << 3
        | this.volume_period

      // NR13 | NR23
    case 0xff13:
    case 0xff18:
      return 0

      // NR14 | NR24
    case 0xff14:
    case 0xff19:
      return self.enabled << 6

    default:
      console.error("Pulse.read: unknown address ", X.Utils.hex16(addr))
    }
  }

  Pulse.prototype.write = function(addr, w) {
    switch (addr) {
      // NR10
    case 0xff10:
      break

      // NR11 | NR21
    case 0xff11:
    case 0xff16:
      this.duty = w >> 6
      this.length_counter = 64 - (w & 0x3F)
      break

      // NR12 | NR22
    case 0xff12:
    case 0xff17:
      this.volume_init = w >> 4
      this.volume_sweep = (w >> 3) & 0x1
      this.volume_period = w & 0x7

      // The upper 5 bits of NRx2 control the DAC
      this.dac_enabled = (w >> 3) > 0

      if (!this.is_dac_enabled()) {
        this.enabled = false
      }
      break

      // NR13 | NR23
    case 0xff13:
    case 0xff18:
      this.frequency = (this.frequency & 0x0700) | (w & 0xFF)
      break

      // NR14 | NR24
    case 0xff14:
    case 0xff19:
      this.frequency = (this.frequency & 0xFF) | ((w & 0x7) << 8)
      this.enabled = (w & 0x40) > 0

      if (w & 0x80 > 0) {
        this.trigger()
      }
      break

    default:
      console.error("Pulse.write: unknown address ", X.Utils.hex16(addr))
    }
  }

  Pulse.prototype.trigger = function() {
    this.enabled = true

    if (this.length_counter == 0) {
      this.length_counter = 64
    }

    this.period = (2048 - this.frequency) * 4

    this.volume_counter = this.volume_period
    this.volume = this.volume_init
  }

  Pulse.prototype.clock_length = function() {
    if (this.length_counter > 0) {
      this.length_counter--
    } else {
      this.enabled = false
    }
  }

  Pulse.prototype.clock_envelope = function() {
    if (this.volume_period > 0) {
      if (this.volume_counter > 0) {
        this.volume_counter--
      } else {
        var new_volume = this.volume + (this.volume_sweep == 0 ? -1 : +1)
        if (new_volume >= 0 && new_volume <= 15) {
          this.volume = new_volume
          this.volume_counter = this.volume_period
        }
      }
    }
  }

  Pulse.prototype.clock_sweep = function() {
    // TODO:
  }

  Pulse.prototype.clock_frequency = function() {
    if (this.period > 0) {
      this.period--
    } else {
      this.period = (2048 - this.frequency) * 4
      this.duty_idx = (this.duty_idx + 1) % 8
    }
  }

  Pulse.prototype.dac_output = function() {
    var out = 0

    if (this.is_dac_enabled()) {
      if (this.is_enabled()) {
        out = duty_cycles[this.duty][this.duty_idx]
          * this.volume / 7.5 - 1.0
      }
    }

    return out
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Audio unit
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  var frame_seq

  var pulse1 = new Pulse()

  var context
  var buffer
  var buffer_length
  var buffer_cursor

  var left_enable_sq1 = true
  var right_enable_sq1 = true

  return {

    init: function() {
      var sample_rate = 44100
      buffer_length = 22050 // 500ms buffer

      context = new window.AudioContext()
      buffer = context.createBuffer(2, buffer_length, sample_rate)
      buffer_cursor = 0

      var source = context.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(context.destination)
      source.start()

      frame_seq = 8192
    },

    clock: function() {
      pulse1.clock_frequency()

      // Frame sequencer timing:
      //
      // Step Length Ctr  Vol Env   Sweep
      // ------------------------------------
      // 0    Clock       -         -
      // 1    -           -         -
      // 2    Clock       -         Clock
      // 3    -           -         -
      // 4    Clock       -         -
      // 5    -           -         -
      // 6    Clock       -         Clock
      // 7    -           Clock     -
      // ------------------------------------
      // Rate 256 Hz      64 Hz     128 Hz
      if (frame_seq > 0) {
        frame_seq--
      } else {
        frame_seq = 8192
        // Clock 512Hz

        // Clock 256Hz
        if (frame_seq % 2 == 0) {
          pulse1.clock_length()
        }

        // Clock 128Hz
        if (frame_seq % 4 == 2) {
          pulse1.clock_sweep()
        }

        // Clock 64Hz
        if (frame_seq % 8 == 7) {
          pulse1.clock_envelope()
        }
      }
    },

    step: function(cycles) {
      while (cycles > 0) {
        X.Audio.clock()

        // Downsample
        if (frame_seq % 95 == 0) {
          // Mix
          var sq1_output = pulse1.dac_output()
          var left = 0
          var right = 0

          if (left_enable_sq1) { left += sq1_output }
          if (right_enable_sq1) { right += sq1_output }

          // Map volume from [0,7] to [0.0, 1.0]
          buffer.getChannelData(0)[buffer_cursor] = left ? left / 7 : 0
          buffer.getChannelData(1)[buffer_cursor] = right ? right / 7 : 0
          buffer_cursor = (buffer_cursor + 1) % buffer_length
        }

        cycles--
      }
    },

    reset: function() {
      // TODO
    },

    r: function(address) {
      switch (address) {
      case 0xff10:
      case 0xff11:
      case 0xff12:
      case 0xff13:
      case 0xff14:
        return pulse1.read(address)
      }
    },

    w: function(address, value) {
      switch (address) {
      case 0xff10:
      case 0xff11:
      case 0xff12:
      case 0xff13:
      case 0xff14:
        pulse1.write(address, value)
        break
      }
    }
  }

})();
