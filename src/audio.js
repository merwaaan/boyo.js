/* global console */

/* Reference material:
 * - http://gbdev.gg8.se/wiki/articles/Gameboy_sound_hardware
 * - http://problemkaputt.de/pandocs.htm#soundcontroller
 */

var X = X || {};

X.Audio = (function() {

  'use strict';

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Pulse channel
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  var DUTY_CYCLES = [
    [0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1],
    [1,0,0,0,0,1,1,1],
    [0,1,1,1,1,1,1,0]
  ];

  function Pulse() {
    this.enabled = 0
    this.dac_enabled = 0
    this.period = 0
    this.frequency = 0
    this.duty = 2
    this.duty_idx = 0
    this.length_enabled = 0
    this.length_counter = 0
    this.volume = 0
    this.volume_init = 0
    this.volume_counter = 0
    this.volume_period = 0
    this.volume_sweep = 0
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
      return this.length_enabled << 6

    default:
      console.error("Pulse.read: unknown address", X.Utils.hex16(addr))
      return 0
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
      this.volume_init   = (w >> 4) & 0x0F
      this.volume_sweep  = (w >> 3) & 0x1
      this.volume_period =  w       & 0x7

      // The upper 5 bits of NRx2 control the DAC
      this.dac_enabled = ((w >> 3) & 0x1F) > 0

      if (!this.dac_enabled) {
        this.enabled = 0
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
      this.length_enabled = (w >> 6) & 1

      if ((w & 0x80) > 0) {
        this.trigger()
      }
      break

    default:
      console.error("Pulse.write: unknown address", X.Utils.hex16(addr))
    }
  }

  Pulse.prototype.trigger = function() {
    this.enabled = 1

    if (this.length_counter == 0) {
      this.length_counter = 64
    }

    this.period = (2048 - this.frequency) * 4

    this.volume_counter = this.volume_period
    this.volume = this.volume_init
  }

  Pulse.prototype.clock_length = function() {
    if (this.length_enabled && this.length_counter > 0) {
      this.length_counter--
      if (this.length_counter == 0) {
        this.enabled = 0
      }
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

    if (this.dac_enabled) {
      if (this.enabled) {
        out = DUTY_CYCLES[this.duty][this.duty_idx] * this.volume
      } else {
        out = 0
      }

      out = out / 7.5 - 1.0
    }

    if (out < -1 || out > 1) {
      throw new Error("sample out of range: " + out)
    }

    return out
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Wave channel
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  function Wave() {
    this.enabled = 0
    this.dac_enabled = 0
    this.period = 0
    this.frequency = 0
    this.length_enabled = 0
    this.length_counter = 0
    this.volume = 0
    this.samples = [0,0,0,0,0,0,0,0,
                    0,0,0,0,0,0,0,0]
    this.sample_nibble = 0
    this.sample_buffer = 0
  }

  Wave.prototype.read = function(address) {
    var out = 0

    switch (address) {
    case 0xff1a:
      out = this.dac_enabled << 7
      break

    case 0xff1c:
      out = this.volume << 5
      break

    case 0xff1e:
      out = this.length_enabled << 6
      break
    }

    return out
  }

  Wave.prototype.write = function(address, value) {
    switch (address) {
    case 0xff1a:
      this.dac_enabled = (value >> 7) & 1

      if (!this.dac_enabled) {
        this.enabled = 0
      }
      break

    case 0xff1b:
      this.length_counter = 256 - (value & 0xFF)
      break

    case 0xff1c:
      this.volume = (value >> 5) & 0x3
      break

    case 0xff1d:
      this.frequency = (this.frequency & 0x0700) | (value & 0xFF)
      break

    case 0xff1e:
      this.frequency = (this.frequency & 0xFF) | ((value & 0x7) << 8)
      this.length_enabled = (value >> 6) & 1

      if ((value & 0x80) > 0) {
        this.trigger()
      }
      break
    }
  }

  Wave.prototype.write_sample = function(idx, value) {
    this.samples[idx] = value
  }

  Wave.prototype.trigger = function() {
    this.enabled = 1

    if (this.length_counter > 0) {
      this.length_counter = 256
    }

    this.period = (2048 - this.frequency) * 2
    this.sample_nibble = 0
  }

  Wave.prototype.clock_length = Pulse.prototype.clock_length

  Wave.prototype.clock_frequency = function() {
    if (this.period > 0) {
      this.period--
    } else {
      this.period = (2048 - this.frequency) * 2

      this.sample_nibble = (this.sample_nibble + 1) % 32
      this.sample_buffer = this.get_current_sample()
    }
  }

  Wave.prototype.get_current_sample = function() {
    var s = this.samples[~~(this.sample_nibble / 2)]

    if (this.sample_nibble % 2 == 0) {
      return s >> 4
    } else {
      return s & 0x0F
    }
  }

  Wave.prototype.dac_output = function() {
    var out = 0

    if (this.dac_enabled) {
      if (this.enabled) {
        var shift = this.volume == 0 ? 4 : this.volume - 1
        out = this.sample_buffer >> shift
      } else {
        out = 0
      }

      out = out / 7.5 - 1.0
    }

    if (out < -1 || out > 1) {
      throw new Error("sample out of range: " + out)
    }

    return out
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Noise channel
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  function Noise() {
    this.enabled = 0
    this.dac_enabled = 0
    this.period = 0
    this.clock_shift = 0
    this.width_mode = 0
    this.divisor_code = 0
    this.lfsr = 0
    this.length_enabled = 0
    this.length_counter = 0
    this.volume = 0
    this.volume_init = 0
    this.volume_counter = 0
    this.volume_period = 0
    this.volume_sweep = 0
  }

  Noise.prototype.read = function(address) {
    var out = 0

    switch (address) {
    case 0xff21:
      out = this.volume_init << 4
        | this.volume_sweep  << 3
        | this.volume_period
      break

    case 0xff22:
      out = this.clock_shift << 4
        | this.width_mode << 3
        | this.divisor_code
      break

    case 0xff23:
      out = this.length_enabled << 6
      break
    }

    return out
  }

  Noise.prototype.write = function(address, value) {
    switch (address) {
    case 0xff20:
      this.length_counter = 64 - (value & 0xFF)
      break

    case 0xff21:
      this.volume_init   = (value >> 4) & 0x0F
      this.volume_sweep  = (value >> 3) & 0x1
      this.volume_period =  value       & 0x7

      // The upper 5 bits of NRx2 control the DAC
      this.dac_enabled = ((value & 0xF8) > 0)

      if (!this.dac_enabled) {
        this.enabled = 0
      }
      break

    case 0xff22:
      this.clock_shift = (value >> 4) & 0xF
      this.width_mode  = (value >> 3) & 1
      this.divisor_code = value       & 0x7
      break

    case 0xff23:
      this.length_enabled = (value >> 6) & 1

      if ((value & 0x80) > 0) {
        this.trigger()
      }
    }
  }

  var period_lookup = [8, 16, 32, 48, 64, 80, 96, 112]

  Noise.prototype.get_period = function() {
    return period_lookup[this.divisor_code] << this.clock_shift
  }

  Noise.prototype.trigger = function() {
    this.enabled = 1

    if (this.length_counter == 0) {
      this.length_counter = 64
    }

    this.period = this.get_period()
    this.lfsr = 0x7FFF

    this.volume_counter = this.volume_period
    this.volume = this.volume_init
  }

  Noise.prototype.clock_length = Pulse.prototype.clock_length
  Noise.prototype.clock_envelope = Pulse.prototype.clock_envelope

  Noise.prototype.clock_frequency = function() {
    if (this.period > 0) {
      this.period--
    } else {
      this.period = this.get_period()

      var bit = (this.lfsr ^ (this.lfsr >> 1)) & 1
      this.lfsr >>= 1
      this.lfsr |= bit << 14
      if (this.width_mode == 1) {
        this.lfsr = (bit << 6) | (this.lfsr & (~0x40))
      }
    }
  }

  Noise.prototype.dac_output = function() {
    var out = 0

    if (this.dac_enabled) {
      if (this.enabled) {
        out = ((~this.lfsr) & 1) * this.volume
      } else {
        out = 0
      }

      out = out / 7.5 - 1.0
    }

    if (out < -1 || out > 1) {
      throw new Error("sample out of range: " + out)
    }

    return out
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // APU
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  var REGISTERS_MASK = [
    0x80, 0x3F, 0x00, 0xFF, 0xBF,
    0xFF, 0x3F, 0x00, 0xFF, 0xBF,
    0x7F, 0xFF, 0x9F, 0xFF, 0xBF,
    0xFF, 0xFF, 0x00, 0x00, 0xBF,
    0x00, 0x00, 0x70
  ]

  var frame_seq_period = 8192; // 512Hz timer

  function APU() {
    this.enabled = 0
    this.pulse1 = new Pulse()
    this.pulse2 = new Pulse()
    this.noise = new Noise()
    this.wave = new Wave()
    this.frame_seq = 0
    this.frame = 0
    this.left_enable_pulse1 = 0
    this.left_enable_pulse2 = 0
    this.left_enable_wave = 0
    this.left_enable_noise = 0
    this.right_enable_pulse1 = 0
    this.right_enable_pulse2 = 0
    this.right_enable_wave = 0
    this.right_enable_noise = 0
    this.left_volume = 0
    this.right_volume = 0

    // Frontend options
    this.mute_pulse1 = false
    this.mute_pulse2 = false
    this.mute_wave = false
    this.mute_noise = false
  }

  APU.prototype.read = function(address) {
    var out = 0

    switch (address) {
    case 0xff10:
    case 0xff11:
    case 0xff12:
    case 0xff13:
    case 0xff14:
      out = this.pulse1.read(address)
      break

    case 0xff16:
    case 0xff17:
    case 0xff18:
    case 0xff19:
      out = this.pulse2.read(address)
      break

    case 0xff1a:
    case 0xff1b:
    case 0xff1c:
    case 0xff1d:
    case 0xff1e:
      out = this.wave.read(address)
      break

    case 0xff20:
    case 0xff21:
    case 0xff22:
    case 0xff23:
      out = this.noise.read(address)
      break

    case 0xff24:
      out = this.left_volume << 4 | this.right_volume
      break

    case 0xff25:
      out = this.right_enable_noise << 7
        | this.right_enable_wave     << 6
        | this.right_enable_pulse2   << 5
        | this.right_enable_pulse1   << 4
        | this.left_enable_noise     << 3
        | this.left_enable_wave      << 2
        | this.left_enable_pulse2    << 1
        | this.left_enable_pulse1
      break

    case 0xff26:
      out = this.enabled       << 7
        | (this.noise.enabled  << 3)
        | (this.wave.enabled   << 2)
        | (this.pulse2.enabled << 1)
        |  this.pulse1.enabled
      break
    }

    return out | REGISTERS_MASK[(address - 0xFF10)]
  }

  APU.prototype.write = function(address, value) {
    switch (address) {
    case 0xff10:
    case 0xff11:
    case 0xff12:
    case 0xff13:
    case 0xff14:
      this.pulse1.write(address, value)
      break

    case 0xff16:
    case 0xff17:
    case 0xff18:
    case 0xff19:
      this.pulse2.write(address, value)
      break

    case 0xff1a:
    case 0xff1b:
    case 0xff1c:
    case 0xff1d:
    case 0xff1e:
      this.wave.write(address, value)
      break

    case 0xff20:
    case 0xff21:
    case 0xff22:
    case 0xff23:
      this.noise.write(address, value)
      break

    case 0xff24:
      this.left_volume = (value >> 4) & 0x7
      this.right_volume = value       & 0x7
      break

    case 0xff25:
      this.right_enable_noise  = (value >> 7) & 1
      this.right_enable_wave   = (value >> 6) & 1
      this.right_enable_pulse2 = (value >> 5) & 1
      this.right_enable_pulse1 = (value >> 4) & 1
      this.left_enable_noise   = (value >> 3) & 1
      this.left_enable_wave    = (value >> 2) & 1
      this.left_enable_pulse2  = (value >> 1) & 1
      this.left_enable_pulse1  = (value     ) & 1
      break

    case 0xff26:
      this.enabled = (value >> 7) & 1
      break

    case 0xff30: case 0xff31: case 0xff32: case 0xff33:
    case 0xff34: case 0xff35: case 0xff36: case 0xff37:
    case 0xff38: case 0xff39: case 0xff3a: case 0xff3b:
    case 0xff3c: case 0xff3d: case 0xff3e: case 0xff3f:
      this.wave.write_sample(address - 0xFF30, value)
      break
    }
  }

  APU.prototype.clock = function() {
    this.pulse1.clock_frequency()
    this.pulse2.clock_frequency()
    this.wave.clock_frequency()
    this.noise.clock_frequency()

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
    if (this.frame_seq > 0) {
      this.frame_seq--
    } else {
      this.frame_seq = frame_seq_period
      this.frame++
      // nothing to clock at 512Hz

      // Clock 256Hz
      if (this.frame % 2 == 0) {
        this.pulse1.clock_length()
        this.pulse2.clock_length()
        this.wave.clock_length()
        this.noise.clock_length()
      }

      // Clock 128Hz
      if (this.frame % 4 == 2) {
        this.pulse1.clock_sweep()
      }

      // Clock 64Hz
      if (this.frame % 8 == 7) {
        this.pulse1.clock_envelope()
        this.pulse2.clock_envelope()
        this.noise.clock_envelope()
      }
    }
  }

  APU.prototype.output_left = function() {
    // Mix
    var out = 0

    if (this.left_volume > 0) {
      if (this.left_enable_pulse1 && !this.mute_pulse1) {
        out += this.pulse1.dac_output()
      }
      if (this.left_enable_pulse2 && !this.mute_pulse2) {
        out += this.pulse2.dac_output()
      }
      if (this.left_enable_wave && !this.mute_wave) {
        out += this.wave.dac_output()
      }
      if (this.left_enable_noise && !this.mute_noise) {
        out += this.noise.dac_output()
      }

      // Normalize
      out /= 4

      // Map volume from ]0,7] to ]0.0, 1.0]
      out *= this.left_volume / 7
    }

    if (out < -1 || out > 1) {
      throw new Error("sample out of range: " + out)
    }

    return out
  }

  APU.prototype.output_right = function() {
    // Mix
    var out = 0

    if (this.right_volume > 0) {
      if (this.right_enable_pulse1 && !this.mute_pulse1) {
        out += this.pulse1.dac_output()
      }
      if (this.right_enable_pulse2 && !this.mute_pulse2) {
        out += this.pulse2.dac_output()
      }
      if (this.right_enable_wave && !this.mute_wave) {
        out += this.wave.dac_output()
      }
      if (this.right_enable_noise && !this.mute_noise) {
        out += this.noise.dac_output()
      }

      // Normalize
      out /= 4

      // Map volume from ]0,7] to ]0.0, 1.0]
      out *= this.right_volume / 7
    }

    if (out < -1 || out > 1) {
      throw new Error("sample out of range: " + out)
    }

    return out
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // WebAudio
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  var apu = new APU()

  var context
  var buffer_left = []
  var buffer_right = []
  var script_processor

  // Assuming a 44100 sample rate
  var sample_rate = 44100
  var apu_cycles_per_sample = X.Constants.cpu_freq / sample_rate

  var apu_cycle_counter = 0
  var apu_sample_counter = 0

  return {

    init: function() {
      context = new window.AudioContext()
      script_processor = context.createScriptProcessor(0, 0, 2)
      script_processor.onaudioprocess = X.Audio.callback

      // Toggle individual channels in the option panel
      document.getElementById('sound').addEventListener('click', function(ev) {
        var channel = ev.target.name

        if (channel == "pulse1") {
          apu.mute_pulse1 = !ev.target.checked
        } else if (channel == "pulse2") {
          apu.mute_pulse2 = !ev.target.checked
        } else if (channel == "wave") {
          apu.mute_wave = !ev.target.checked
        } else if (channel == "noise") {
          apu.mute_noise = !ev.target.checked
        }
      })
    },

    run: function(cycles) {
      apu_cycle_counter += cycles

      while (apu_cycle_counter > 0) {
        apu.clock()
        apu_cycle_counter--
      }

      apu_sample_counter += cycles
      while (apu_sample_counter >= apu_cycles_per_sample) {
        buffer_left.push(apu.output_left())
        buffer_right.push(apu.output_right())
        apu_sample_counter -= apu_cycles_per_sample
      }
    },

    reset: function() {
      apu_cycle_counter = 0
      apu_sample_counter = 0
      buffer_left.length = 0
      buffer_right.length = 0
    },

    r: function(address) {
      return apu.read(address)
    },

    w: function(address, value) {
      apu.write(address, value)
    },

    callback: function(ev) {
      var out = ev.outputBuffer
      var delta = buffer_left.length - out.length
      if (delta < 0) {
        console.warn("Audio buffer underrun: %d samples", delta)
      } else if (delta > (out.length * 2)) {
        console.warn("Audio buffer overrun: %d samples", delta)
      }
      out.getChannelData(0).set(buffer_left.splice(0, out.length))
      out.getChannelData(1).set(buffer_right.splice(0, out.length))
    },

    pause: function() {
      script_processor.disconnect(context.destination)
    },

    resume: function() {
      script_processor.connect(context.destination)
    },
  }

})();
