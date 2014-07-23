var X = X ||{};

X.GB = (function() {

  'use strict';
  
  return {
  
    init: function() {

      X.CPU.init();
      X.Debugger.init();

      X.Cartridge.init(game);

      //document.querySelector('input#rom').addEventListener('change', function() {});
    },

    step: function(debug) {

      X.CPU.step();

      if (debug)
        X.Debugger.update();
    },

    run: function() {

      for (var i = 0; i < 50000; ++i) {

        if (X.Debugger.reached_breakpoint()) {
          X.Debugger.update();
          return;
        }

        X.GB.step();
      }
    }

  };

})();
