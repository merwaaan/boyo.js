/* global console */

/* Reference material:
 * - http://gbdev.gg8.se/wiki/articles/Gameboy_sound_hardware
 * - http://problemkaputt.de/pandocs.htm#soundcontroller
 */

var X = X || {};

X.Audio = (function() {

  'use strict';

  var audio;
  var next_starts = [0, 0, 0, 0];

  var ram = new Uint8Array(0xFF3F - 0xFF10 + 1);

  var GB_FREQ = 4194304;
  var sample_rate = 44100;
  var cycles_per_samples = GB_FREQ / sample_rate;

  function Timer(period, auto_reload) {
    this.set_period(period);
    if (auto_reload === undefined) { auto_reload = true; }
    this.auto_reload = auto_reload;
    this.counter = this.period;
    this.outputs = [];
  }

  Timer.prototype.clock = function() {
    if (this.auto_reload && this.counter === 0) {
      this.counter = this.period;
    }

    if (this.counter > 0) {
      --this.counter;

      if (this.counter === 0) {
        this.outputs.forEach(function(cb) { cb(); });
      }
    }

    return this.counter;
  };

  Timer.prototype.output = function() {
    return this.counter;
  };

  Timer.prototype.set_period = function(period) {
    if (period % 1 !== 0) {
      console.warn('in timer: period is not an integer, ', period);
      period = Math.floor(period);
    }

    if (period === 0) {
      console.error('in timer: period is zero');
      period = 1;
    }

    this.period = period;
  };

  Timer.prototype.attach = function(cb) {
    this.outputs.push(cb);
  };

  function Counter(count, auto_reload) {
    return new Timer(count + 1, auto_reload);
  }

  var duty_cycles = [
    [0,0,0,0,1,0,0,0],
    [0,0,0,0,1,1,0,0],
    [0,0,1,1,1,1,0,0],
    [1,1,1,1,0,0,1,1]
  ];

  function DutyCycle(pattern) {
    this.timer = new Counter((2048 - 0) * 4);
    this.pattern = pattern;
    this.counter = new Counter(7);

    this.timer.attach(this.counter.clock.bind(this.counter));
  }

  DutyCycle.prototype.clock = function() {
    this.timer.clock();
  };

  DutyCycle.prototype.output = function () {
    return duty_cycles[this.pattern][this.counter.output()];
  };

  function LengthCounter() {
    this.timer = new Counter(GB_FREQ / 256);
    this.down_counter = new Counter(0, false);
    this.disabled = 0;

    this.timer.attach(this.down_counter.clock.bind(this.down_counter));
  }

  LengthCounter.prototype.set_counter = function(value) {
    if (value < 0) {
      console.warn('in LengthCounter.set_counter: negative counter');
      value = 0;
    }

    this.down_counter.counter = value;
  };

  LengthCounter.prototype.get_counter = function() {
    return this.down_counter.counter;
  };

  LengthCounter.prototype.clock = function() {
    if (this.disabled === 0) {
      this.timer.clock();

      if (this.down_counter.counter === 0) {
        this.disabled = 1;
      }
    }
  };

  LengthCounter.prototype.output = function() {
    return this.down_counter.counter > 0 ? 1 : 0;
  };

  function Envelope() {
    this.timer = new Counter(GB_FREQ / 64);
    this.step_length_counter = new Counter(7);
    this.volume = 0;
    this.volume_direction = 0;

    this.timer.attach(this.step_length_counter.clock.bind(this.step_length_counter));
    this.step_length_counter.attach(this.change_volume.bind(this));
  }

  Envelope.prototype.clock = function() {
    this.timer.clock();
  };

  Envelope.prototype.change_volume = function() {
    if (this.volume_direction === 0 && this.volume > 0) {
      --this.volume;
    }

    else if (this.volume_direction === 1 && this.volume < 16) {
      ++this.volume;
    }
  };

  Envelope.prototype.output = function() {
    return this.volume;
  };

  function Square() {
    this.duty_cycle = new DutyCycle(2);
    this.length_counter = new LengthCounter();
    this.envelope = new Envelope();
  }

  Square.prototype.init = function() {

  };

  Square.prototype.output = function() {
    if (this.length_counter.disabled === 1) {
      return 0;
    }

    var out = this.duty_cycle.output();
    out = out & this.length_counter.output();
    out *= this.envelope.output();
    out /= 15;
    out *= 0.5; // final dampening to avoid distortion

    return out;
  };

  Square.prototype.clock = function() {
    this.duty_cycle.clock();
    this.length_counter.clock();
    this.envelope.clock();
  };

  Square.prototype.w_nrx0 = function(value) {
    // this.sweep.period = (value >> 4) & 0xf;
    // this.sweep.negate = (value >> 3) & 0x1;
    // this.sweep.shift = value & 0x7;
  };

  Square.prototype.w_nrx1 = function(value) {
    this.duty_cycle.pattern = value >> 6;
    this.length_counter.set_counter(64 - (value & 0x3f));
  };

  Square.prototype.w_nrx2 = function(value) {
    this.envelope_start_volume = value >> 4;
    this.envelope_volume_direction = (value >> 3) & 0x1;
    this.envelope_step_length = value & 0x7;

    if (this.envelope_step_length === 0) {
      this.envelope_step_length = 8;
    }
  };

  Square.prototype.w_nrx3 = function(value) {
    this.freq = value | (this.freq & 0x700);
  };

  Square.prototype.w_nrx4 = function(value) {
    this.freq = ((value & 0x7) << 8) | (this.freq & 0xff);
    this.length_counter.disabled = (value >> 6) & 0x1;
    this.trigger = (value >> 7) & 0x1;

    if (this.trigger === 1) {
      this.length_counter.disabled = 0;
      if (this.length_counter.get_counter() === 0) {
        this.length_counter.set_counter(0x3f);
      }

      this.duty_cycle.timer.set_period((2048 - this.freq) * 4);

      this.envelope.volume = this.envelope_start_volume;
      this.envelope.volume_direction = this.envelope_volume_direction;
      this.envelope.step_length_counter.set_period(this.envelope_step_length);
    }
  };

  function WavePlayback() {
    this.timer = new Counter((2048 - 0) * 2);
    this.position_counter = new Counter(31);

    this.timer.attach(this.position_counter.clock.bind(this.position_counter));
  }

  WavePlayback.prototype.clock = function() {
    this.timer.clock();
  };

  WavePlayback.prototype.output = function() {
    var byt = ram[Math.floor(this.position_counter.counter / 2)];
    var nibble = (byt >> (4 * (1 - (this.position_counter.counter % 2)))) & 0xf;
    var sample = nibble / 0xf;

    return sample;
  };

  function Wave() {
    this.length_counter = new LengthCounter();
    this.wave_playback = new WavePlayback();
  }

  Wave.prototype.init = function() {

  };

  Wave.prototype.clock = function() {
    this.length_counter.clock();
    this.wave_playback.clock();
  };

  Wave.prototype.output = function() {
    if (this.enabled === 0) {
      return 0;
    }

    var out = this.wave_playback.output();
    if (this.length_counter.output() === 0) {
      out = 0;
    }

    switch (this.volume_code) {
      case 0: out = 0; break;
      case 1: break;
      case 2: out = out >> 1; break;
      case 3: out = out >> 2; break;
    }

    out /= 15;
    out *= 2; // gives some boost

    return out;
  };

  Wave.prototype.w_nrx0 = function(value) {
    this.enabled = (value >> 7) & 0x1;
  };

  Wave.prototype.w_nrx1 = function(value) {
    this.length_counter.set_counter(256 - (value & 0xff));
  };

  Wave.prototype.w_nrx2 = function(value) {
    this.volume_code = (value >> 5) & 0x3;
  };

  Wave.prototype.w_nrx3 = Square.prototype.w_nrx3;

  Wave.prototype.w_nrx4 = function(value) {
    this.trigger = (value >> 7) & 0x1;
    this.length_counter.disabled = (value >> 6) & 0x1;
    this.freq = ((value & 0x7) << 8) | (this.freq & 0xff);

    if (this.trigger) {
      this.length_counter.disabled = 0;
      if (this.length_counter.get_counter() === 0) {
        this.length_counter.set_counter(0xff);
      }

      this.wave_playback.timer.set_period((2048 - this.freq) * 2);

      this.wave_playback.position_counter.counter = 31;
    }
  };

  function PRNG() {
    this.timer = new Counter(2000);
    this.timer.attach(this.lfsr.bind(this));
    this.shift_register = 0xff;
    this.width_mode = 0;
  }

  PRNG.prototype.clock = function() {
    this.timer.clock();
  };

  PRNG.prototype.lfsr = function() {
    var bit0 = this.shift_register & 0x1;
    this.shift_register >>>= 1;
    var bit1 = this.shift_register & 0x1;
    var xor = bit0 ^ bit1;
    this.shift_register = xor << 0xf | this.shift_register;

    if (this.width_mode === 1) {
      this.shift_register = xor << 0x6 | this.shift_register;
    }
  };

  PRNG.prototype.output = function() {
    return ~(this.shift_register & 0x1);
  };

  function Noise() {
    this.prng = new PRNG();
    this.length_counter = new LengthCounter();
    this.envelope = new Envelope();

    this.clock_shift = 0;
    this.divisor_code = 0;
  }

  Noise.prototype.init = function() {
  };

  Noise.prototype.clock = function() {
    this.prng.clock();
    this.length_counter.clock();
    this.envelope.clock();
  };

  Noise.prototype.output = function() {
    var out = this.prng.output();
    out = out & this.length_counter.output();
    out *= this.envelope.output();
    out /= 15;
    out *= 0.5; // final dampening to avoid distortion

    return out;
  };

  Noise.prototype.w_nrx1 = function(value) {
    this.length_counter.set_counter(64 - (value & 0x3f));
  };

  Noise.prototype.w_nrx2 = Square.prototype.w_nrx2;

  Noise.prototype.w_nrx3 = function(value) {
    this.clock_shift = value >> 4;
    this.prng.width_mode = (value >> 3) & 0x1;
    this.divisor_code = value & 0x7;
  };

  Noise.prototype.w_nrx4 = function(value) {
    this.trigger = (value >> 7) & 0x1;
    this.length_counter.disabled = (value >> 6) & 0x1;

    if (this.trigger) {
      this.length_counter.disabled = 0;
      if (this.length_counter.counter === 0) {
        this.length_counter.counter = 0x3f;
      }

      var r = this.divisor_code === 0 ? 0.5 : this.divisor_code;
      var base = 16 * r;
      this.prng.timer.set_period(base << this.clock_shift);

      this.prng.shift_register = 0xff;

      this.envelope.volume = this.envelope_start_volume;
      this.envelope.volume_direction = this.envelope_volume_direction;
      this.envelope.step_length_counter.set_period(this.envelope_step_length);
    }
  };

  var sq1 = new Square();
  var sq2 = new Square();
  var wav = new Wave();
  var noise = new Noise();

  var control = {
    left_vol: 0,
    right_vol: 0
  };

  return {

    init: function() {
      audio = new window.AudioContext();
    },

    step: function(elapsed) {
      var samples = elapsed * audio.sampleRate;

      var buffers = [];
      var raw_left = [];
      var raw_right = [];

      for (var i = 0; i < 4; ++i) {
        buffers[i] = audio.createBuffer(2, samples, audio.sampleRate);
        raw_left[i] = buffers[i].getChannelData(0);
        raw_right[i] = buffers[i].getChannelData(1);
      }

      for (i = 0; i < samples; ++i) {
        for (var c = 0; c < cycles_per_samples; ++c) {
          sq1.clock();
          sq2.clock();
          wav.clock();
          //noise.clock();
        }

        raw_left[0][i] = sq1.output() * sq1.left_enable * control.left_vol;
        raw_left[1][i] = sq2.output() * sq2.left_enable * control.left_vol;
        raw_left[2][i] = wav.output() * wav.left_enable * control.left_vol;
        //raw_left[3][i] = noise.output() * noise.left_enable * control.left_vol;
        raw_right[0][i] = sq1.output() * sq1.right_enable * control.right_vol;
        raw_right[1][i] = sq2.output() * sq2.right_enable * control.right_vol;
        raw_right[2][i] = wav.output() * wav.right_enable * control.right_vol;
        //raw_right[3][i] = noise.output() * noise.left_enable * control.left_vol;
      }

      // Last sample, if fractional
      if (i < Math.ceil(samples)) {
        var leftover = leftover % 1;
        for (c = cycles_per_samples * leftover; c > 0; --c) {
          sq1.clock();
          sq2.clock();
          wav.clock();
          //noise.clock();
        }

        raw_left[0][i] = leftover * raw_left[0][i - 1] +
          (1 - leftover) * sq1.output() * sq1.left_enable * control.left_vol;
        raw_left[1][i] = leftover * raw_left[1][i - 1] +
          (1 - leftover) * sq2.output() * sq2.left_enable * control.left_vol;
        raw_left[2][i] = leftover * raw_left[2][i - 1] +
          (1 - leftover) * wav.output() * wav.left_enable * control.left_vol;
        //raw_left[3][i] = leftover * raw_left[3][i - 1] + (1 -
        //leftover) * noise.output() * noise.left_enable *
        //control.left_vol;
        raw_right[0][i] = leftover * raw_right[0][i - 1] +
          (1 - leftover) * sq1.output() * sq1.right_enable * control.right_vol;
        raw_right[1][i] = leftover * raw_right[1][i - 1] +
          (1 - leftover) * sq2.output() * sq2.right_enable * control.right_vol;
        raw_right[2][i] = leftover * raw_right[2][i - 1] +
          (1 - leftover) * wav.output() * wav.right_enable * control.right_vol;
        //raw_right[3][i] = leftover * raw_right[3][i - 1] + (1 - leftover) * noise.output() * noise.right_enable * control.right_vol;
      }

      // Schedule buffers to play
      for (i = 0; i < 4; ++i) {
        if (next_starts[i] === 0) {
          // Add small delay to avoid playback catching up with sound
          // creation
          next_starts[i] = audio.currentTime + 0.050;
        }

        var source = audio.createBufferSource();
        source.buffer = buffers[i];
        source.connect(audio.destination);
        source.start(next_starts[i]);

        next_starts[i] += buffers[i].duration;
      }
    },

    reset: function() {
      // TODO
    },

    r: function(address) {
      switch (address) {
      case 0xff26:
        var bit0 = sq1.length_counter.output();
        var bit1 = sq2.length_counter.output();
        var bit2 = wav.length_counter.output();
        var bit3 = noise.length_counter.output();
        var ret = bit0 |
          bit1 << 1 |
          bit2 << 2 |
          bit3 << 3;
        return ret;

      default:
        return ram[address - 0xFF10];
      }
    },

    w: function(address, value) {
      ram[address - 0xFF10] = value;

      switch (address) {
      case 0xff10:
        sq1.w_nrx0(value);
        break;

      case 0xff11:
        sq1.w_nrx1(value);
        break;

      case 0xff12:
        sq1.w_nrx2(value);
        break;

      case 0xff13:
        sq1.w_nrx3(value);
        break;

      case 0xff14:
        sq1.w_nrx4(value);
        break;

      case 0xff16:
        sq2.w_nrx1(value);
        break;

      case 0xff17:
        sq2.w_nrx2(value);
        break;

      case 0xff18:
        sq2.w_nrx3(value);
        break;

      case 0xff19:
        sq2.w_nrx4(value);
        break;

      case 0xff1a:
        wav.w_nrx0(value);
        break;

      case 0xff1b:
        wav.w_nrx1(value);
        break;

      case 0xff1c:
        wav.w_nrx2(value);
        break;

      case 0xff1d:
        wav.w_nrx3(value);
        break;

      case 0xff1e:
        wav.w_nrx4(value);
        break;

      case 0xff20:
        noise.w_nrx1(value);
        break;

      case 0xff21:
        noise.w_nrx2(value);
        break;

      case 0xff22:
        noise.w_nrx3(value);
        break;

      case 0xff23:
        noise.w_nrx4(value);
        break;

      case 0xff24:
        control.left_vol = ((value >> 4) & 0x7) / 7;
        control.right_vol = (value & 0x7) / 7;
        break;

      case 0xff25:
        noise.left_enable = (value >> 7) & 0x1;
        wav.left_enable = (value >> 6) & 0x1;
        sq2.left_enable = (value >> 5) & 0x1;
        sq1.left_enable = (value >> 4) & 0x1;
        noise.right_enable = (value >> 3) & 0x1;
        wav.right_enable = (value >> 2) & 0x1;
        sq2.right_enable = (value >> 1) & 0x1;
        sq1.right_enable = value & 0x1;
        break;
      }
    }

  };

})();
