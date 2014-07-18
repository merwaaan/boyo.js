var X = X ||{};

X.GB = (function() {

  'use strict';
  
  return {
  
    init: function() {

      X.CPU.init();
      X.Debugger.init();
    },

    step: function() {

      X.CPU.step();
    },

    run: function() {

      for (var i = 0; i < 1000; ++i) {

        if (X.Debugger.reached_breakpoint())
          return;

        X.GB.step();
      }
    }

  };

})();
