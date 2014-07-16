(function(globals) {

  globals.GB = {
  
    run: function() {
    
      X.CPU.init();
      X.CPU.reset();

      for (var i = 0; i < 1000000; ++i)
        X.CPU.step();

    }
  };

})(X || {});
