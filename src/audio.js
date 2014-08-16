/* global AudioContext:true */

var X = X || {};

X.Audio = (function() {

  'use strict';

  var audio;

  var ram = new Uint8Array(0xFF3F - 0xFF10 + 1);

  var reset_ram = [0x80, 0xbf, 0xf3, 0xff, 0xbf, 0xff, 0x3f, 0x00,
                   0xff, 0xbf, 0x7f, 0xff, 0x9f, 0xff, 0xbf, 0xff,
                   0xff, 0x00, 0x00, 0xbf, 0x77, 0xf3, 0xf1];

  var sq1 = {
    node: null,
    on: false,
    frequency: 0,
    envelope: {
      node: null,
      volume: 0,
      direction: 0,
      length: 0
    }
  };

  var sq2 = {
    node: null,
    on: false,
    frequency: 0,
    envelope: {
      node: null,
      volume: 0,
      direction: 0,
      length: 0
    }
  };

  return {

    init: function() {

      audio = new AudioContext();

      sq1.node = audio.createOscillator();
      sq1.node.type = 'square';
      sq1.node.frequency.value = 3000;
      sq1.node.start();

      sq1.envelope.node = audio.createGain();
      sq1.envelope.node.gain.value = 0;
      sq1.node.connect(sq1.envelope.node);
      sq1.envelope.node.connect(audio.destination);

      sq2.node = audio.createOscillator();
      sq2.node.type = 'square';
      sq2.node.frequency.value = 3000;
      sq2.node.start();

      sq2.envelope.node = audio.createGain();
      sq2.envelope.node.gain.value = 0;
      sq2.node.connect(sq1.envelope.node);
      sq2.envelope.node.connect(audio.destination);
    },

    step: function() {
      if (sq1.on) {

        ++sq1.envelope.count;

        if (sq1.envelope.count >= sq1.envelope.length) {
          sq1.envelope.count -= sq1.envelope.length;
          sq1.envelope.node.gain.value += sq1.envelope.direction / 0xf;
          if (sq1.envelope.node.gain.value < 0) { sq1.envelope.node.gain.value = 0;}
          else if (sq1.envelope.node.gain.value > 1) { sq1.envelope.node.gain.value = 1; }
        }

      }

      if (sq2.on) {

        ++sq2.envelope.count;

        if (sq2.envelope.count >= sq2.envelope.length) {
          sq2.envelope.count = 0;
          sq2.envelope.node.gain.value += sq2.envelope.direction / 0xf;
          if (sq2.envelope.node.gain.value < 0) { sq2.envelope.node.gain.value = 0; }
          else if (sq2.envelope.node.gain.value > 1) { sq2.envelope.node.gain.value = 1; }
        }

      }
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
        // Channel 1 Sound length/Wave pattern duty
        case 0xff11:
        // sq1.duty = (value & 0xc0) >> 6;
        // sq1.length = 1 / 256 * (64 - (value & 0x3f));
        break;

        // Channel 1 Volume Envelope
        case 0xff12:
        sq1.envelope.volume = value >> 4;
        sq1.envelope.direction = (value & 0x8) >> 3 ? 1 : -1;
        sq1.envelope.length = (value & 0x7);
        break;

        // Channel 1 Frequency lo
        case 0xff13:
        sq1.frequency = ((ram[0xff14 - 0xff10] & 0x7) << 8) | ram[0xff13 - 0xff10];
        break;

        // Channel 1 Frequency hi
        case 0xff14:
        sq1.frequency = ((ram[0xff14 - 0xff10] & 0x7) << 8) | ram[0xff13 - 0xff10];

        if (value & 0x80) {
          sq1.on = true;
          sq1.node.frequency.value = 131072 / (2048 - sq1.frequency);
          sq1.envelope.node.gain.value = sq1.envelope.volume / 0xf;
          sq1.envelope.count = 0;
        }

        break;

        // Channel 2 Volume Envelope
        case 0xff17:
        sq2.envelope.volume = value >> 4;
        sq2.envelope.direction = (value & 0x8) >> 3 ? 1 : -1;
        sq2.envelope.length = (value & 0x7);
        break;

        // Channel 2 Frequency lo
        case 0xff18:
        sq2.frequency = ((ram[0xff19 - 0xff10] & 0x7) << 8) | ram[0xff18 - 0xff10];
        break;

        // Channel 2 Frequency hi
        case 0xff19:
        sq2.frequency = ((ram[0xff19 - 0xff10] & 0x7) << 8) | ram[0xff18 - 0xff10];

        if (value & 0x80) {
          sq2.on = true;
          sq2.node.frequency.value = 131072 / (2048 - sq2.frequency);
          sq2.envelope.node.gain.value = sq2.envelope.volume / 0xf;
          sq2.envelope.count = 0;
        }

        break;

      }
    }

  };

})();
