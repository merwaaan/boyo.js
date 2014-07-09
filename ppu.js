var PPU = function(famicom) {

  'use strict';
  
	var famicom = famicom;

  var memory = new Array(0x4000);
  
  return {
  
    read: function(address) {
      return this.memory[address];
    },

    write: function(address, value) {
      this.memory[address] = value;
    },

    reset: function() {     
    },

    step: function() {
    }

  };
  
};