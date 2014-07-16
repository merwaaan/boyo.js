var expect = chai.expect;

describe('Opcodes', function() {

  describe('BIT', function() {

    var registers = [
      'B',
      'C',
      'D',
      'E',
      'H',
      'L',
      '(HL)', // jump this
      'A'
    ];
    
    var f = function(b, r) {    
      it('BIT '+b+','+registers[r], function() {
        
        var register_name = registers[r];
        X.CPU[register_name] = X.Utils.random8();

        var opcode = 0x140 + r + b * 8;
        X.CPU.instructions[opcode]();
        
        expect(X.CPU.zero).to.equal(!X.Utils.nth_bit(X.CPU[register_name], b));
        expect(X.CPU.addsub).to.equal(false);
        expect(X.CPU.halfcarry).to.equal(true);
      });      
    };
    
    for (var b = 0; b < 8; ++b) {
      for (var r = 0; r < registers.length; ++r) {
        if (r == 6) continue;
        f(b,r);
      }
    }
    
  });

  describe('CCF', function() {

    it('CCF ', function() {
    
      var old_value = X.CPU.carry;
    
      X.CPU.instructions[0x3f]();
      
      expect(X.CPU.carry).to.equal(!old_value);
    });
    
  });

  describe('DEC r', function() {

    var registers = {
      'A': [0x3d],
      'B': [0x05],
      'C': [0x0d],
      'D': [0x15],
      'E': [0x1d],
      'H': [0x25],
      'L': [0x2d]
    };
    
    for (var r in registers) {
      it('DEC '+r, function() {
        
        X.CPU[r] = X.Utils.random8();
        var old_value = X.CPU[r];
        
        var opcode = registers[r][0];
        X.CPU.instructions[opcode]();
        
        expect(X.CPU[r]).to.equal(old_value - 1);
      });
    }
    
  });

  describe('DEC rr', function() {

    var registers = {
      'BC': [0x0b],
      'DE': [0x1b],
      'HL': [0x2b],
      'SP': [0x3b]
    };
    
    for (var r in registers) {
      it('DEC '+r, function() {
        
        X.CPU[r] = X.Utils.random8();
        var old_value = X.CPU[r];
        
        var opcode = registers[r][0];
        X.CPU.instructions[opcode]();
        
        expect(X.CPU[r]).to.equal(old_value - 1);
      });
    }
    
  });

  describe('INC r', function() {

    var registers = {
      'A': [0x3c],
      'B': [0x04],
      'C': [0x0C],
      'D': [0x14],
      'E': [0x1c],
      'H': [0x24],
      'L': [0x2C]
    };
    
    for (var r in registers) {
      it('INC '+r, function() {
        
        X.CPU[r] = X.Utils.random8();
        var old_value = X.CPU[r];
        
        var opcode = registers[r][0];
        X.CPU.instructions[opcode]();
        
        expect(X.CPU[r]).to.equal(old_value + 1);
      });
    }
    
  });

  describe('INC rr', function() {

    var registers = {
      'BC': [0x03],
      'DE': [0x13],
      'HL': [0x23],
      'SP': [0x33]
    };
    
    for (var r in registers) {
      it('INC '+r, function() {
        
        X.CPU[r] = X.Utils.random8();
        var old_value = X.CPU[r];
        
        var opcode = registers[r][0];
        X.CPU.instructions[opcode]();
        
        expect(X.CPU[r]).to.equal(old_value + 1);
      });
    }
    
  });

  describe('LD r,n', function() {

    var registers = {
      'B': [0x06, 1],
      'C': [0x0E, 2],
      'D': [0x16, 3],
      'E': [0x1E, 4],
      'H': [0x26, 5],
      'L': [0x2E, 6]
    };
    
    var f = function(r) {
      it('LD '+r+',n', function() {
          
          var opcode = registers[r][0];
          var value = registers[r][1];
          X.CPU.instructions[opcode]([value]);
          
          expect(X.CPU[r]).to.equal(value);
        });
    };
    
    for (var r in registers) {
      f(r);
    }
    
  });

  describe('RES', function() {

    var registers = [
      'B',
      'C',
      'D',
      'E',
      'H',
      'L',
      '(HL)', // jump this
      'A'
    ];
    
    var f = function(b, r) {    
      it('RES '+b+','+registers[r], function() {
        
        var register_name = registers[r];
        X.CPU[register_name] = X.Utils.random8();

        var opcode = 0x180 + r + b * 8;
        X.CPU.instructions[opcode]();
        
        expect(X.Utils.nth_bit(X.CPU[register_name], b)).to.equal(false);
      });      
    };
    
    for (var b = 0; b < 8; ++b) {
      for (var r = 0; r < registers.length; ++r) {
        if (r == 6) continue;
        f(b,r);
      }
    }
    
  });

  describe('SCF', function() {

    it('SCF ', function() {
      
      X.CPU.instructions[0x37]();
      
      expect(X.CPU.carry).to.equal(true);
    });
    
  });

  describe('SET', function() {

    var registers = [
      'B',
      'C',
      'D',
      'E',
      'H',
      'L',
      '(HL)', // jump this
      'A'
    ];
    
    var f = function(b, r) {    
      it('SET '+b+','+registers[r], function() {
        
        var register_name = registers[r];
        X.CPU[register_name] = X.Utils.random8();

        var opcode = 0x1C0 + r + b * 8;
        X.CPU.instructions[opcode]();
        
        expect(X.Utils.nth_bit(X.CPU[register_name], b)).to.equal(true);
      });      
    };
    
    for (var b = 0; b < 8; ++b) {
      for (var r = 0; r < registers.length; ++r) {
        if (r == 6) continue;
        f(b,r);
      }
    }
    
  });
  
});
