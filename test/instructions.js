var expect = chai.expect;

describe('CCF', function() {

  it('CCF ', function() {
    var old_value = X.CPU.get_flag(X.CPU.Flags.CARRY);
    X.CPU.instructions[0x3f]();
    expect(X.CPU.get_flag(X.CPU.Flags.CARRY)).to.equal(!X.CPU.get_flag(old_value));
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
  
  for (var r in registers) {
    it('LD '+r+',n', function() {
      var opcode = registers[r][0];
      var value = registers[r][1];
      X.CPU.instructions[opcode]([value]);
      expect(X.CPU[r]).to.equal(value);
    });
  }
  
});

describe('SCF', function() {

  it('SCF ', function() {
    X.CPU.instructions[0x37]();
    expect(X.CPU.get_flag(X.CPU.Flags.CARRY)).to.equal(true);
  });
  
});