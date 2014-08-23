/* Reference material:
 * - http://gbdev.gg8.se/wiki/articles/Gameboy_sound_hardware
 * - http://problemkaputt.de/pandocs.htm#soundcontroller
 */

var X = X || {};

X.Audio = (function() {

  'use strict';

  var audio;

  var ram = new Uint8Array(0xFF3F - 0xFF10 + 1);

  var reset_ram = [0x80, 0xbf, 0xf3, 0xff, 0xbf, 0xff, 0x3f, 0x00,
                   0xff, 0xbf, 0x7f, 0xff, 0x9f, 0xff, 0xbf, 0xff,
                   0xff, 0x00, 0x00, 0xbf, 0x77, 0xf3, 0xf1];

  var duty_waves = [];

  function Channel() {
    // NRx1
    this.duty = 0;
    this.length_counter = {
      enabled: 0,
      conter: 0
    };

    // NRx2
    this.envelope = {
      start_volume: 0,
      add_mode: 0,
      period: 0,
      timer: 0,
      volume_counter: 0
    };

    // NRx3 & NRx4
    this.frequency = 0;

    this.trigger = 0;
    this.length_enable = 0;
  }

  Channel.prototype.init = function(audio) {
    this.oscillator = audio.createOscillator();
    this.oscillator.setPeriodicWave(duty_waves[2]);
    this.oscillator.frequency.value = 3000;
    this.oscillator.start();

    this.volume = audio.createGain();
    this.volume.gain.value = 0;

    this.oscillator.connect(this.volume);
    this.volume.connect(audio.destination);
  };

  Channel.prototype.step = function(elapsed) {
    // Length Counter
    var l = this.length_counter;

    if (l.counter > 0) {
      // Clocked at 256Hz
      l.counter -= elapsed / (1 / 256);
      if (l.counter < 0) { l.counter = 0; }

      if (l.counter === 0) {
        l.enabled = 0;
        this.volume.gain.value = 0;
      }
    }

    // Envelope
    var e = this.envelope;

    // Clocked at 64Hz
    e.timer -= elapsed / (1 / 64);

    if (e.timer <= 0 && e.period > 0) {
      e.timer = e.period;

      if (e.add_mode === 0) { --e.volume_counter; }
      else { ++e.volume_counter; }

      if (e.volume_counter < 0) { e.volume_counter = 0; }
      else if (e.volume_counter > 15) { e.volume_counter = 15; }

      this.volume.gain.value = e.volume_counter / 15;
    }
  };

  // NR10 FF10 -PPP NSSS Sweep period, negate, shift
  Channel.prototype.w_nrx0 = function(value) {
    this.sweep.period = (value >> 4) & 0xf;
    this.sweep.negate = (value >> 3) & 0x1;
    this.sweep.shift = value & 0x7;
  };

  // NR11 FF11 DDLL LLLL Duty, Length load (64-L)
  Channel.prototype.w_nrx1 = function(value) {
    var duty = value >> 6;
    this.length_counter.counter = 64 - (value & 0x3f);

    if (this.duty !== duty) {
      this.duty = duty;
      this.oscillator.setPeriodicWave(duty_waves[this.duty]);
    }
  };

  // NR12 FF12 VVVV APPP Starting volume, Envelope add mode, period
  Channel.prototype.w_nrx2 = function(value) {
    this.envelope.start_volume = value >> 4;
    this.envelope.add_mode = (value >> 3) & 0x1;
    this.envelope.period = value & 0x7;
  };

  // NR13 FF13 FFFF FFFF Frequency LSB
  Channel.prototype.w_nrx3 = function(value) {
    this.frequency = value | (this.frequency & 0x700);
  };

  // NR14 FF14 TL-- -FFF Trigger, Length enable, Frequency MSB
  Channel.prototype.w_nrx4 = function(value) {
    this.frequency = ((value & 0x7) << 8) | (this.frequency & 0xff);
    this.length_enable = (value >> 6) & 0x1;
    this.trigger = (value >> 7) & 0x1;

    if (this.trigger) {
      this.length_counter.enabled = 1;
      if (this.length_counter.counter === 0) {
        this.length_counter.counter = 64;
      }

      this.oscillator.frequency.value = 131072 / (2048 - this.frequency);
      this.envelope.timer = this.envelope.period;
      this.envelope.volume_counter = this.envelope.start_volume;
      this.volume.gain.value = this.envelope.volume_couter / 15;
    }
  };

  var sq1 = new Channel();
  // NR10
  sq1.sweep = {
    period: 0,
    negate: 0,
    shift: 0
  };

  var sq2 = new Channel();

  var control = {
    // NR52
    all_on: 0,
    noise_on: 0,
    wave_on: 0,
    sq2_on: 0,
    sq1_on: 0
  };

  return {

    init: function() {
      audio = new window.AudioContext();

      // Create oscillators for all duty patterns
      var harmonics = 32;      // A higher value yields a sharper sound
      var length = 1 + harmonics;

      duty_waves = [.125, .25, .5, .75].map(function createDuty(d) {
        var a = new Float32Array(length);
        var b = new Float32Array(length);

        // Pulse waveform expressed as a Fourier series
        // Formula from: http://www.dspguide.com/ch13/4.htm

        a[0] = d;
        b[0] = 0;

        for (var n = 1; n < length; ++n) {
          b[n] = 0;
          a[n] = 2 / (n * Math.PI) * Math.sin(n * Math.PI * d);
        }

        return audio.createPeriodicWave(a, b);
      });

      sq1.init(audio);
      sq2.init(audio);
    },

    step: function(elapsed) {
      sq1.step(elapsed);
      sq2.step(elapsed);
    },

    reset: function() {
      for (var i = 0; i < reset_ram.length; ++i) {
        ram[i] = reset_ram[i];
      }
    },

    r: function(address) {
      return ram[address - 0xFF10];
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

      }
    }

  };

})();
