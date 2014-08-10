var X = X || {};

X.Joypad = (function() {

  'use strict';

  var codes = [
    [65, 90, 32, 13], // Buttons: A, Z, Space, Enter
    [39, 37, 38, 40] // Directions: arrows
  ];

  var keys = {}; // Key states
  var selection = 0; // 0x10 -> buttons, 0x20 -> directions, otherwise -> disabled

  var to_byte = function() {

    if (selection != 0x10 && selection != 0x20)
      return 0xF;

    var selected = selected == 0x10 ? codes[0] : codes[1];
    var input = _.reduce(selected, function(byte, code, bit) {
      return byte | (keys[code] ? 0 : 1) << bit;
    }, 0);

    return selection | input;
  };

  return {

    init: function() {

      document.addEventListener('keydown', function(event) {
        if (_.contains(_.flatten(codes), event.keyCode) && !keys[event.keyCode]) {
          keys[event.keyCode] = true;
          X.CPU.request_interrupt(4);
          X.CPU.stopped = false; // Button presses terminate STOP
        }
      });

      document.addEventListener('keyup', function(event) {
        if (event.keyCode in keys) {
          keys[event.keyCode] = false;
        }
      });
    },

    reset: function() {
      
      // Initialize all keys to false (up)      
      _.each(_.flatten(codes), function(code) {
        keys[code] = false;
      });

      selection = 0;
    },

    r: function() {

      return to_byte();
    },

    w: function(value) {

      selection = value & 0x30;
      return to_byte();
    }

  };
  
})();
