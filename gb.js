var X = X || {};

X.GB = {
  
  run: function() {
  
    X.CPU.init();
    //X.Debugger.init();
    X.CPU.reset();
    for (var i = 0; i < 1000000; ++i) {
      X.CPU.step();
    }
    
  },
  
  test: function() {
  
    X.CPU.init();
    mocha.setup('bdd');
    mocha.run();
  }
  
};

/*
GB.prototype.insert = function(rom) {

  this.rom = rom;

  for (var p = 0; p < 2; ++p)
    for (var a = 0; a < 16384; ++a) {
      address_rom = this.rom.addresses.prg[this.rom.addresses.prg.length === 1 ? 0 : p] + a;      
      this.cpu.write(0x8000 + a + p * 16384, this.rom.data[address_rom]);
    }
}

GB.prototype.reset = function() {

	this.cpu.reset();
}

X.prototype.run = function() {

  this.reset();
  
  //setInterval(function() { this.cpu.step(); }.bind(this), 10);
  for (var i = 0; i < 20000; ++i) {
    var cycles = this.cpu.step();
    for (; cycles >= 0; cycles -= 3) {
      this.ppu.step();
    }
  }
  
  //console.log(this.cpu.memory.slice(0x6000));
}
*/
