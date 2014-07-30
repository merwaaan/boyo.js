var X = X || {};

X.Joypad = (function() {

  'use strict';

  var button_codes = [65, 90, 32, 13]; // A, Z, Space, Enter
  var direction_codes = [39, 37, 38, 40]; // Arrows

  var keys = {};
  var buttons = true; // true -> buttons selected, false -> directions selected

  var to_byte = function() {

    var padding = 0x3 << 6;
    
    var selected = buttons ? 0x10 : 0x20;

    var selection = buttons ? button_codes : direction_codes;
    var input = _.reduce(selection, function(byte, code, bit) {
      return byte | (keys[code] ? 0 : 1) << bit;
    }, 0);

    return padding | selected | input;
  };

  return {

    init: function() {

      // Initialize all keys to false (up)      
      _.each(button_codes.concat(direction_codes), function(code) {
        keys[code] = false;
      });

      document.addEventListener('keydown', function(event) {
        if (_.contains(button_codes, event.keyCode) || _.contains(direction_codes, event.keyCode)) {
          keys[event.keyCode] = true;
          X.CPU.stopped = false; // Button presses terminate STOP
        }
      }.bind(this));

      document.addEventListener('keyup', function(event) {
        if (_.contains(button_codes, event.keyCode) || _.contains(direction_codes, event.keyCode))
          keys[event.keyCode] = false;
      }.bind(this));
    },

    reset: function() {
      
    },

    r: function() {

      return to_byte();
    },

    w: function(value) {

      // Select either directions (bit 4 reset) or buttons (bit 5 reset)
      if (!X.Utils.bit(value, 4)) {
        buttons = false;
      }
      else if (!X.Utils.bit(value, 5)) {
        buttons = true;
      }

      // What if 11 (Tetris) ??

      return to_byte();
    }

  };
  
})();
