var X = X ||{};

X.GB = (function() {

  'use strict';
  
  return {
  
    init: function() {

      X.CPU.init();
      X.PPU.init();
      X.Debugger.init();

      X.Cartridge.init(game);

      //setInterval(function() {for(var i=0; i < 100;++i)this.step(true);}.bind(this), 1);
      //document.querySelector('input#rom').addEventListener('change', function() {});
    },

    step: function(debug) {

      X.CPU.step();

      if (debug)
        X.Debugger.update();
    },

    run: function() {

      for (var i = 0; i < 500000; ++i) {

        if (X.Debugger.reached_breakpoint()) {
          X.Debugger.update();
          return;
        }

        X.GB.step();
        if (i==499999) console.log('loop limit');
      }
    }

  };

})();
