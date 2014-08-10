var X = X || {};

X.Audio = (function() {

  'use strict';

  var audio;

  var channel_2_length_pattern;
  var channel_2_envelope;
  var channel_2_frequency_lo;
  var channel_2_frequency_hi;

  return {

    channel_2: {
      node: null,
    },

    init: function() {

      audio = new AudioContext();

      this.channel_2.node = audio.createOscillator();
    },

    reset: function() {

    },

    r: function(address) {

    },

    w: function(address, value) {

    }

  };
  
})();
