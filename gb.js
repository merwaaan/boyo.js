var X = X ||{};

X.GB = (function() {

  'use strict';
  
  return {
  
    init: function() {

      X.CPU.init();
      X.Debugger.init();

      return;

      for (var i = 0; i < 1000000; ++i)
        X.CPU.step();
    },

    pause: function() {
      
      //X.CPU.pause();
    },

    step: function() {
      X.CPU.step();
    },

    run: function() {
      //X.CPU.run();

    }
  };

})();
