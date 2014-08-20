var X = X || {};

X.InstructionSet = (function() {

  'use strict'

  /**
    * List of opcodes fetched from http://www.pastraiser.com/X.CPU/gameboy/gameboy_opcodes.html
    */

  var opcode_specs = [['NOP', 1, [4]], ['LD BC,d16', 3, [12]], ['LD (BC),A', 1, [8]], ['INC BC', 1, [8]], ['INC B', 1, [4]], ['DEC B', 1, [4]], ['LD B,d8', 2, [8]], ['RLCA', 1, [4]], ['LD_nn_SP d16,SP', 3, [20]], ['ADD HL,BC', 1, [8]], ['LD A,(BC)', 1, [8]], ['DEC BC', 1, [8]], ['INC C', 1, [4]], ['DEC C', 1, [4]], ['LD C,d8', 2, [8]], ['RRCA', 1, [4]], ['STOP 0', 2, [4]], ['LD DE,d16', 3, [12]], ['LD (DE),A', 1, [8]], ['INC DE', 1, [8]], ['INC D', 1, [4]], ['DEC D', 1, [4]], ['LD D,d8', 2, [8]], ['RLA', 1, [4]], ['JR d8', 2, [12]], ['ADD HL,DE', 1, [8]], ['LD A,(DE)', 1, [8]], ['DEC DE', 1, [8]], ['INC E', 1, [4]], ['DEC E', 1, [4]], ['LD E,d8', 2, [8]], ['RRA', 1, [4]], ['JR fNZ,d8', 2, [12, 8]], ['LD HL,d16', 3, [12]], ['LDI (HL),A', 1, [8]], ['INC HL', 1, [8]], ['INC H', 1, [4]], ['DEC H', 1, [4]], ['LD H,d8', 2, [8]], ['DAA', 1, [4]], ['JR fZ,d8', 2, [12, 8]], ['ADD HL,HL', 1, [8]], ['LDI A,(HL)', 1, [8]], ['DEC HL', 1, [8]], ['INC L', 1, [4]], ['DEC L', 1, [4]], ['LD L,d8', 2, [8]], ['CPL', 1, [4]], ['JR fNC,d8', 2, [12, 8]], ['LD SP,d16', 3, [12]], ['LDD (HL),A', 1, [8]], ['INC SP', 1, [8]], ['INC (HL)', 1, [12]], ['DEC (HL)', 1, [12]], ['LD (HL),d8', 2, [12]], ['SCF', 1, [4]], ['JR fC,d8', 2, [12, 8]], ['ADD HL,SP', 1, [8]], ['LDD A,(HL)', 1, [8]], ['DEC SP', 1, [8]], ['INC A', 1, [4]], ['DEC A', 1, [4]], ['LD A,d8', 2, [8]], ['CCF', 1, [4]], ['LD B,B', 1, [4]], ['LD B,C', 1, [4]], ['LD B,D', 1, [4]], ['LD B,E', 1, [4]], ['LD B,H', 1, [4]], ['LD B,L', 1, [4]], ['LD B,(HL)', 1, [8]], ['LD B,A', 1, [4]], ['LD C,B', 1, [4]], ['LD C,C', 1, [4]], ['LD C,D', 1, [4]], ['LD C,E', 1, [4]], ['LD C,H', 1, [4]], ['LD C,L', 1, [4]], ['LD C,(HL)', 1, [8]], ['LD C,A', 1, [4]], ['LD D,B', 1, [4]], ['LD D,C', 1, [4]], ['LD D,D', 1, [4]], ['LD D,E', 1, [4]], ['LD D,H', 1, [4]], ['LD D,L', 1, [4]], ['LD D,(HL)', 1, [8]], ['LD D,A', 1, [4]], ['LD E,B', 1, [4]], ['LD E,C', 1, [4]], ['LD E,D', 1, [4]], ['LD E,E', 1, [4]], ['LD E,H', 1, [4]], ['LD E,L', 1, [4]], ['LD E,(HL)', 1, [8]], ['LD E,A', 1, [4]], ['LD H,B', 1, [4]], ['LD H,C', 1, [4]], ['LD H,D', 1, [4]], ['LD H,E', 1, [4]], ['LD H,H', 1, [4]], ['LD H,L', 1, [4]], ['LD H,(HL)', 1, [8]], ['LD H,A', 1, [4]], ['LD L,B', 1, [4]], ['LD L,C', 1, [4]], ['LD L,D', 1, [4]], ['LD L,E', 1, [4]], ['LD L,H', 1, [4]], ['LD L,L', 1, [4]], ['LD L,(HL)', 1, [8]], ['LD L,A', 1, [4]], ['LD (HL),B', 1, [8]], ['LD (HL),C', 1, [8]], ['LD (HL),D', 1, [8]], ['LD (HL),E', 1, [8]], ['LD (HL),H', 1, [8]], ['LD (HL),L', 1, [8]], ['HALT', 1, [4]], ['LD (HL),A', 1, [8]], ['LD A,B', 1, [4]], ['LD A,C', 1, [4]], ['LD A,D', 1, [4]], ['LD A,E', 1, [4]], ['LD A,H', 1, [4]], ['LD A,L', 1, [4]], ['LD A,(HL)', 1, [8]], ['LD A,A', 1, [4]], ['ADD A,B', 1, [4]], ['ADD A,C', 1, [4]], ['ADD A,D', 1, [4]], ['ADD A,E', 1, [4]], ['ADD A,H', 1, [4]], ['ADD A,L', 1, [4]], ['ADD A,(HL)', 1, [8]], ['ADD A,A', 1, [4]], ['ADC A,B', 1, [4]], ['ADC A,C', 1, [4]], ['ADC A,D', 1, [4]], ['ADC A,E', 1, [4]], ['ADC A,H', 1, [4]], ['ADC A,L', 1, [4]], ['ADC A,(HL)', 1, [8]], ['ADC A,A', 1, [4]], ['SUB B', 1, [4]], ['SUB C', 1, [4]], ['SUB D', 1, [4]], ['SUB E', 1, [4]], ['SUB H', 1, [4]], ['SUB L', 1, [4]], ['SUB (HL)', 1, [8]], ['SUB A', 1, [4]], ['SBC A,B', 1, [4]], ['SBC A,C', 1, [4]], ['SBC A,D', 1, [4]], ['SBC A,E', 1, [4]], ['SBC A,H', 1, [4]], ['SBC A,L', 1, [4]], ['SBC A,(HL)', 1, [8]], ['SBC A,A', 1, [4]], ['AND B', 1, [4]], ['AND C', 1, [4]], ['AND D', 1, [4]], ['AND E', 1, [4]], ['AND H', 1, [4]], ['AND L', 1, [4]], ['AND (HL)', 1, [8]], ['AND A', 1, [4]], ['XOR B', 1, [4]], ['XOR C', 1, [4]], ['XOR D', 1, [4]], ['XOR E', 1, [4]], ['XOR H', 1, [4]], ['XOR L', 1, [4]], ['XOR (HL)', 1, [8]], ['XOR A', 1, [4]], ['OR B', 1, [4]], ['OR C', 1, [4]], ['OR D', 1, [4]], ['OR E', 1, [4]], ['OR H', 1, [4]], ['OR L', 1, [4]], ['OR (HL)', 1, [8]], ['OR A', 1, [4]], ['CP B', 1, [4]], ['CP C', 1, [4]], ['CP D', 1, [4]], ['CP E', 1, [4]], ['CP H', 1, [4]], ['CP L', 1, [4]], ['CP (HL)', 1, [8]], ['CP A', 1, [4]], ['RET fNZ', 1, [20, 8]], ['POP BC', 1, [12]], ['JP fNZ,d16', 3, [16, 12]], ['JP d16', 3, [16]], ['CALL fNZ,d16', 3, [24, 12]], ['PUSH BC', 1, [16]], ['ADD A,d8', 2, [8]], ['RST 00H', 1, [16]], ['RET fZ', 1, [20, 8]], ['RET', 1, [16]], ['JP fZ,d16', 3, [16, 12]], null, ['CALL fZ,d16', 3, [24, 12]], ['CALL d16', 3, [24]], ['ADC A,d8', 2, [8]], ['RST 08H', 1, [16]], ['RET fNC', 1, [20, 8]], ['POP DE', 1, [12]], ['JP fNC,d16', 3, [16, 12]], null, ['CALL fNC,d16', 3, [24, 12]], ['PUSH DE', 1, [16]], ['SUB d8', 2, [8]], ['RST 10H', 1, [16]], ['RET fC', 1, [20, 8]], ['RETI', 1, [16]], ['JP fC,d16', 3, [16, 12]], null, ['CALL fC,d16', 3, [24, 12]], null, ['SBC A,d8', 2, [8]], ['RST 18H', 1, [16]], ['LD ($FF00+d8),A', 2, [12]], ['POP HL', 1, [12]], ['LD ($FF00+C),A', 1, [8]], null, null, ['PUSH HL', 1, [16]], ['AND d8', 2, [8]], ['RST 20H', 1, [16]], ['ADD SP,d8', 2, [16]], ['JP HL', 1, [4]], ['LD (d16),A', 3, [16]], null, null, null, ['XOR d8', 2, [8]], ['RST 28H', 1, [16]], ['LD A,($FF00+d8)', 2, [12]], ['POP AF', 1, [12]], ['LD A,($FF00+C)', 1, [8]], ['DI', 1, [4]], null, ['PUSH AF', 1, [16]], ['OR d8', 2, [8]], ['RST 30H', 1, [16]], ['LDHL SP,d8', 2, [12]], ['LD SP,HL', 1, [8]], ['LD A,(d16)', 3, [16]], ['EI', 1, [4]], null, null, ['CP d8', 2, [8]], ['RST 38H', 1, [16]], ['RLC B', 2, [8]], ['RLC C', 2, [8]], ['RLC D', 2, [8]], ['RLC E', 2, [8]], ['RLC H', 2, [8]], ['RLC L', 2, [8]], ['RLC (HL)', 2, [16]], ['RLC A', 2, [8]], ['RRC B', 2, [8]], ['RRC C', 2, [8]], ['RRC D', 2, [8]], ['RRC E', 2, [8]], ['RRC H', 2, [8]], ['RRC L', 2, [8]], ['RRC (HL)', 2, [16]], ['RRC A', 2, [8]], ['RL B', 2, [8]], ['RL C', 2, [8]], ['RL D', 2, [8]], ['RL E', 2, [8]], ['RL H', 2, [8]], ['RL L', 2, [8]], ['RL (HL)', 2, [16]], ['RL A', 2, [8]], ['RR B', 2, [8]], ['RR C', 2, [8]], ['RR D', 2, [8]], ['RR E', 2, [8]], ['RR H', 2, [8]], ['RR L', 2, [8]], ['RR (HL)', 2, [16]], ['RR A', 2, [8]], ['SLA B', 2, [8]], ['SLA C', 2, [8]], ['SLA D', 2, [8]], ['SLA E', 2, [8]], ['SLA H', 2, [8]], ['SLA L', 2, [8]], ['SLA (HL)', 2, [16]], ['SLA A', 2, [8]], ['SRA B', 2, [8]], ['SRA C', 2, [8]], ['SRA D', 2, [8]], ['SRA E', 2, [8]], ['SRA H', 2, [8]], ['SRA L', 2, [8]], ['SRA (HL)', 2, [16]], ['SRA A', 2, [8]], ['SWAP B', 2, [8]], ['SWAP C', 2, [8]], ['SWAP D', 2, [8]], ['SWAP E', 2, [8]], ['SWAP H', 2, [8]], ['SWAP L', 2, [8]], ['SWAP (HL)', 2, [16]], ['SWAP A', 2, [8]], ['SRL B', 2, [8]], ['SRL C', 2, [8]], ['SRL D', 2, [8]], ['SRL E', 2, [8]], ['SRL H', 2, [8]], ['SRL L', 2, [8]], ['SRL (HL)', 2, [16]], ['SRL A', 2, [8]], ['BIT 0,B', 2, [8]], ['BIT 0,C', 2, [8]], ['BIT 0,D', 2, [8]], ['BIT 0,E', 2, [8]], ['BIT 0,H', 2, [8]], ['BIT 0,L', 2, [8]], ['BIT 0,(HL)', 2, [16]], ['BIT 0,A', 2, [8]], ['BIT 1,B', 2, [8]], ['BIT 1,C', 2, [8]], ['BIT 1,D', 2, [8]], ['BIT 1,E', 2, [8]], ['BIT 1,H', 2, [8]], ['BIT 1,L', 2, [8]], ['BIT 1,(HL)', 2, [16]], ['BIT 1,A', 2, [8]], ['BIT 2,B', 2, [8]], ['BIT 2,C', 2, [8]], ['BIT 2,D', 2, [8]], ['BIT 2,E', 2, [8]], ['BIT 2,H', 2, [8]], ['BIT 2,L', 2, [8]], ['BIT 2,(HL)', 2, [16]], ['BIT 2,A', 2, [8]], ['BIT 3,B', 2, [8]], ['BIT 3,C', 2, [8]], ['BIT 3,D', 2, [8]], ['BIT 3,E', 2, [8]], ['BIT 3,H', 2, [8]], ['BIT 3,L', 2, [8]], ['BIT 3,(HL)', 2, [16]], ['BIT 3,A', 2, [8]], ['BIT 4,B', 2, [8]], ['BIT 4,C', 2, [8]], ['BIT 4,D', 2, [8]], ['BIT 4,E', 2, [8]], ['BIT 4,H', 2, [8]], ['BIT 4,L', 2, [8]], ['BIT 4,(HL)', 2, [16]], ['BIT 4,A', 2, [8]], ['BIT 5,B', 2, [8]], ['BIT 5,C', 2, [8]], ['BIT 5,D', 2, [8]], ['BIT 5,E', 2, [8]], ['BIT 5,H', 2, [8]], ['BIT 5,L', 2, [8]], ['BIT 5,(HL)', 2, [16]], ['BIT 5,A', 2, [8]], ['BIT 6,B', 2, [8]], ['BIT 6,C', 2, [8]], ['BIT 6,D', 2, [8]], ['BIT 6,E', 2, [8]], ['BIT 6,H', 2, [8]], ['BIT 6,L', 2, [8]], ['BIT 6,(HL)', 2, [16]], ['BIT 6,A', 2, [8]], ['BIT 7,B', 2, [8]], ['BIT 7,C', 2, [8]], ['BIT 7,D', 2, [8]], ['BIT 7,E', 2, [8]], ['BIT 7,H', 2, [8]], ['BIT 7,L', 2, [8]], ['BIT 7,(HL)', 2, [16]], ['BIT 7,A', 2, [8]], ['RES 0,B', 2, [8]], ['RES 0,C', 2, [8]], ['RES 0,D', 2, [8]], ['RES 0,E', 2, [8]], ['RES 0,H', 2, [8]], ['RES 0,L', 2, [8]], ['RES 0,(HL)', 2, [16]], ['RES 0,A', 2, [8]], ['RES 1,B', 2, [8]], ['RES 1,C', 2, [8]], ['RES 1,D', 2, [8]], ['RES 1,E', 2, [8]], ['RES 1,H', 2, [8]], ['RES 1,L', 2, [8]], ['RES 1,(HL)', 2, [16]], ['RES 1,A', 2, [8]], ['RES 2,B', 2, [8]], ['RES 2,C', 2, [8]], ['RES 2,D', 2, [8]], ['RES 2,E', 2, [8]], ['RES 2,H', 2, [8]], ['RES 2,L', 2, [8]], ['RES 2,(HL)', 2, [16]], ['RES 2,A', 2, [8]], ['RES 3,B', 2, [8]], ['RES 3,C', 2, [8]], ['RES 3,D', 2, [8]], ['RES 3,E', 2, [8]], ['RES 3,H', 2, [8]], ['RES 3,L', 2, [8]], ['RES 3,(HL)', 2, [16]], ['RES 3,A', 2, [8]], ['RES 4,B', 2, [8]], ['RES 4,C', 2, [8]], ['RES 4,D', 2, [8]], ['RES 4,E', 2, [8]], ['RES 4,H', 2, [8]], ['RES 4,L', 2, [8]], ['RES 4,(HL)', 2, [16]], ['RES 4,A', 2, [8]], ['RES 5,B', 2, [8]], ['RES 5,C', 2, [8]], ['RES 5,D', 2, [8]], ['RES 5,E', 2, [8]], ['RES 5,H', 2, [8]], ['RES 5,L', 2, [8]], ['RES 5,(HL)', 2, [16]], ['RES 5,A', 2, [8]], ['RES 6,B', 2, [8]], ['RES 6,C', 2, [8]], ['RES 6,D', 2, [8]], ['RES 6,E', 2, [8]], ['RES 6,H', 2, [8]], ['RES 6,L', 2, [8]], ['RES 6,(HL)', 2, [16]], ['RES 6,A', 2, [8]], ['RES 7,B', 2, [8]], ['RES 7,C', 2, [8]], ['RES 7,D', 2, [8]], ['RES 7,E', 2, [8]], ['RES 7,H', 2, [8]], ['RES 7,L', 2, [8]], ['RES 7,(HL)', 2, [16]], ['RES 7,A', 2, [8]], ['SET 0,B', 2, [8]], ['SET 0,C', 2, [8]], ['SET 0,D', 2, [8]], ['SET 0,E', 2, [8]], ['SET 0,H', 2, [8]], ['SET 0,L', 2, [8]], ['SET 0,(HL)', 2, [16]], ['SET 0,A', 2, [8]], ['SET 1,B', 2, [8]], ['SET 1,C', 2, [8]], ['SET 1,D', 2, [8]], ['SET 1,E', 2, [8]], ['SET 1,H', 2, [8]], ['SET 1,L', 2, [8]], ['SET 1,(HL)', 2, [16]], ['SET 1,A', 2, [8]], ['SET 2,B', 2, [8]], ['SET 2,C', 2, [8]], ['SET 2,D', 2, [8]], ['SET 2,E', 2, [8]], ['SET 2,H', 2, [8]], ['SET 2,L', 2, [8]], ['SET 2,(HL)', 2, [16]], ['SET 2,A', 2, [8]], ['SET 3,B', 2, [8]], ['SET 3,C', 2, [8]], ['SET 3,D', 2, [8]], ['SET 3,E', 2, [8]], ['SET 3,H', 2, [8]], ['SET 3,L', 2, [8]], ['SET 3,(HL)', 2, [16]], ['SET 3,A', 2, [8]], ['SET 4,B', 2, [8]], ['SET 4,C', 2, [8]], ['SET 4,D', 2, [8]], ['SET 4,E', 2, [8]], ['SET 4,H', 2, [8]], ['SET 4,L', 2, [8]], ['SET 4,(HL)', 2, [16]], ['SET 4,A', 2, [8]], ['SET 5,B', 2, [8]], ['SET 5,C', 2, [8]], ['SET 5,D', 2, [8]], ['SET 5,E', 2, [8]], ['SET 5,H', 2, [8]], ['SET 5,L', 2, [8]], ['SET 5,(HL)', 2, [16]], ['SET 5,A', 2, [8]], ['SET 6,B', 2, [8]], ['SET 6,C', 2, [8]], ['SET 6,D', 2, [8]], ['SET 6,E', 2, [8]], ['SET 6,H', 2, [8]], ['SET 6,L', 2, [8]], ['SET 6,(HL)', 2, [16]], ['SET 6,A', 2, [8]], ['SET 7,B', 2, [8]], ['SET 7,C', 2, [8]], ['SET 7,D', 2, [8]], ['SET 7,E', 2, [8]], ['SET 7,H', 2, [8]], ['SET 7,L', 2, [8]], ['SET 7,(HL)', 2, [16]], ['SET 7,A', 2, [8]]];

  /**
    * Instruction
    */

  function Instruction(name, bytes, cycles, procedure, parameters) {

    this.name = name;
    this.type = name.split(' ')[0];

    this.bytes = bytes;

    this.cycles = cycles;
    this.conditional = cycles.length == 2;

    this.procedure = procedure;
    this.parameters = parameters;
  }

  Instruction.prototype.execute = function(operands) {

    X.CPU.PC = X.CPU.PC + this.bytes & 0xFFFF;

    var conditional_result = this.procedure(this.parameters, operands);

    if (this.conditional && conditional_result)
      return this.cycles[1];
    else
      return this.cycles[0];
  };

  Instruction.prototype.to_string = function() {
    var string = '"' + this.name + '" of type ' + this.type;
    if (this.parameters.length > 0)
      string += ' with parameters ' + _.map(this.parameters, function(parameter) { return parameter.to_string(); }).join(' and ');
    return string;
  };

  /**
    * Parameter types
    */

  function Parameter() {}
  Parameter.prototype.get = function() { console.log('Parameter does not implement get() ' + this.to_string()); };
  Parameter.prototype.set = function() { console.log('Parameter does not implement set() ' + this.to_string()); };
  Parameter.prototype.to_string = function() { return '[' + this.constructor.name + ']'; };

  function RegisterParameter(register) { this.register = register; }
  X.Utils.inherit(RegisterParameter, Parameter);
  RegisterParameter.prototype.get = function() { return X.CPU[this.register]; };
  RegisterParameter.prototype.set = function(operands, value) { X.CPU[this.register] = value; };
  RegisterParameter.prototype.to_string = function() { return '[' + this.constructor.name + ', ' + this.register + ']'; };

  function Immediate8BitParameter() {}
  X.Utils.inherit(Immediate8BitParameter, Parameter);
  Immediate8BitParameter.prototype.get = function(operands) { return operands[0]; };

  function Immediate16BitParameter() {}
  X.Utils.inherit(Immediate16BitParameter, Parameter);
  Immediate16BitParameter.prototype.get = function(operands) { return X.Utils.hilo(operands[1], operands[0]); };

  function FixedValueParameter(value) { this.value = value; }
  X.Utils.inherit(FixedValueParameter, Parameter);
  FixedValueParameter.prototype.get = function() { return this.value; };
  FixedValueParameter.prototype.to_string = function() { return '[' + this.constructor.name + ', ' + X.Utils.hex8(this.value) + ']'; };

  function IOPortParameter(parameter) { this.parameter = parameter; }
  X.Utils.inherit(IOPortParameter, Parameter);
  IOPortParameter.prototype.get = function(operands) { return 0xFF00 + this.parameter.get(operands); };
  IOPortParameter.prototype.to_string = function() { return '[' + this.constructor.name + ', ' + this.parameter.to_string() + ']'; };

  function FlagStatusParameter(flag, state) { this.flag = flag; this.state = state; }
  X.Utils.inherit(FlagStatusParameter, Parameter);
  FlagStatusParameter.prototype.get = function() { return X.CPU[this.flag] == this.state; };
  FlagStatusParameter.prototype.to_string = function() { return '[' + this.constructor.name + ', ' + (this.state ? '' : 'non-') + this.flag + ']'; };

  function PointerParameter(parameter) { this.parameter = parameter; }
  X.Utils.inherit(PointerParameter, Parameter);
  PointerParameter.prototype.get = function(operands) { return X.Memory.r(this.parameter.get(operands)); };
  PointerParameter.prototype.set = function(operands, value) { X.Memory.w(this.parameter.get(operands), value); };
  PointerParameter.prototype.to_string = function() { return '[' + this.constructor.name + ' -> ' + this.parameter.to_string() + ']'; };

  /**
    *
    */

  function generate_instruction(opcode, specs) {

    var name = specs[0];

    var signature = name.split(' ')[1];
    var parameter_names = signature ? signature.split(',') : [];

    var parameters = parameter_names.map(function(parameter_name) {
      return generate_parameter(opcode, parameter_name);
    });

    var procedure_name = name.split(' ')[0];
    var procedure = instruction_implementations[procedure_name](parameters);

    var bytes= specs[1];
    var cycles = specs[2];

    return new Instruction(name, bytes, cycles, procedure, parameters);
  }

  /**
    *
    */

  function generate_parameter(opcode, parameter_name) {

    var parameter;

    // Get the parametere name without paentheses
    var core = parameter_name.match(/^\(?(.+?)\)?$/)[1];

    if (core.match(/^[A-Z]+$/)) { // Register
      parameter = new RegisterParameter(core);
    }
    else if (core == 'd8') { // Immediate 8-bit value
      parameter = new Immediate8BitParameter();
    }
    else if (core == 'd16') { // Immediate 16-bit value
      parameter = new Immediate16BitParameter();
    }
    else if (core.match(/^[0-7]$/)) { // Bit
      parameter = new FixedValueParameter(parseInt(core));
    }
    else if (core.match(/^[0-3][0|8]H$/)) { // Offset from $0000
      parameter = new FixedValueParameter(parseInt(core, 16));
    }
    else if (core.match(/^\$FF00\+(C|d8)$/)) { // Zero-page
      var sub_parameter = generate_parameter(opcode, _.last(core) == 'C' ? 'C' : 'd8');
      parameter = new IOPortParameter(sub_parameter);
    }
    else if (core.match(/^fN?[CZ]$/)) { // Flag status condition
      var state = parameter_name[1] == 'N' ? false : true;
      var flag = _.last(parameter_name) == 'Z' ? 'zero' : 'carry';
      parameter = new FlagStatusParameter(flag, state);
    }
    else {
      console.warn('Unrecognized parameter, that\'s not supposed to happen!', X.Utils.hex8(opcode), parameter_name);
    }

    // If the parameter is between parentheses, add a layer of indirection

    if (parameter_name[0] == '(') {
      parameter = new PointerParameter(parameter);
    }

    return parameter;
  };

  /**
    * Implementations
    */

  var instruction_implementations = {

    ADC: function(parameters) {
      return function(parameters, operands) {
        var a = X.CPU.A;
        var b = parameters[1].get(operands);
        var x = a + b + X.CPU.carry;
        X.CPU.A = x & 0xFF;
        X.CPU.zero = X.CPU.A == 0;
        X.CPU.addsub = false;
        X.CPU.halfcarry = (a & 0xF) + (b & 0xF) + (X.CPU.carry & 0xF) > 0xF;
        X.CPU.carry = x > 0xFF;
      };
    },

    ADD: function(parameters) {
      switch (parameters[0].register) {

        case 'HL':
        return function(parameters, operands) {
          var a = X.CPU.HL;
          var b = parameters[1].get(operands);
          var x = a + b;
          X.CPU.HL = x & 0xFFFF;
          X.CPU.addsub = false;
          X.CPU.halfcarry = (a & 0xFFF) + (b & 0xFFF) > 0xFFF;
          X.CPU.carry = x > 0xFFFF;
        };

        case 'SP':
        return function(parameters, operands) {
          var a = X.CPU.SP;
          var b = X.Utils.signed(parameters[1].get(operands));
          var x = a + b;
          X.CPU.SP = x & 0xFFFF;
          X.CPU.zero = false;
          X.CPU.addsub = false;
          X.CPU.halfcarry = (a & 0xF) + (b & 0xF) > 0xF;
          X.CPU.carry = (a & 0xFF) + (b & 0xFF) > 0xFF;
        };

        case 'A':
        return function(parameters, operands) {
          var a = X.CPU.A;
          var b = parameters[1].get(operands);
          var x = a + b;
          X.CPU.A = x & 0xFF;
          X.CPU.zero = X.CPU.A == 0;
          X.CPU.addsub = false;
          X.CPU.halfcarry = (a & 0xF) + (b & 0xF) > 0xF;
          X.CPU.carry = x > 0xFF;
        };
      }
    },

    AND: function(parameters) {
      return function(parameters, operands) {
        X.CPU.A &= parameters[0].get(operands);
        X.CPU.zero = X.CPU.A == 0;
        X.CPU.addsub = false;
        X.CPU.halfcarry = true;
        X.CPU.carry = false;
      };
    },

    BIT: function(parameters) {
      return function(parameters, operands) {
        X.CPU.zero = !X.Utils.bit(parameters[1].get(), parameters[0].get());
        X.CPU.addsub = false;
        X.CPU.halfcarry = true;
      };
    },

    CALL: function(parameters) {
      return parameters.length == 1 ?
        function(parameters, operands) {
          X.CPU.call(parameters[0].get(operands));
        } :
        function(parameters, operands) {
          if (parameters[0].get(operands)) {
            X.CPU.call(parameters[1].get(operands));
            return true;
          }
        };
    },

    CCF: function(parameters) {
      return function(parameters, operands) {
        X.CPU.addsub = false;
        X.CPU.halfcarry = false;
        X.CPU.carry = !X.CPU.carry;
      };
    },

    CP: function(parameters) {
      return function(parameters, operands) {
        var b = parameters[0].get(operands);
        X.CPU.zero = X.CPU.A == b;
        X.CPU.addsub = true;
        X.CPU.halfcarry = (X.CPU.A & 0xF) < (b & 0xF);
        X.CPU.carry = X.CPU.A < b;
      };
    },

    CPL: function(parameters) {
      return function(parameters, operands) {
        X.CPU.A = ~X.CPU.A & 0xFF;
        X.CPU.addsub = true;
        X.CPU.halfcarry = true;
      };
    },

    // Instruction code from DMGBoy (https://code.google.com/p/dmgboy/source/browse/src/Instructions.cpp#437)
    DAA: function(parameters) {
      return function(parameters, operands) {
        var a = X.CPU.A;
        if (!X.CPU.addsub) {
          if (X.CPU.halfcarry || ((a & 0xF) > 9))
              a += 0x06;
          if (X.CPU.carry || (a > 0x9F))
              a += 0x60;
        }
        else {
          if (X.CPU.halfcarry)
              a = (a - 6) & 0xFF;
          if (X.CPU.carry)
              a -= 0x60;
        }
        if (a > 0xFF)
          X.CPU.carry = true;
        X.CPU.A = a & 0xFF;
        X.CPU.zero = X.CPU.A == 0;
        X.CPU.halfcarry = false;
        // http://www.youtube.com/watch?v=rJp86_tj9KQ
      }
    },

    DEC: function(parameters) {
      return parameters[0] instanceof RegisterParameter && parameters[0].register.length == 2 ?
        function(parameters, operands) {
          parameters[0].set(operands, parameters[0].get(operands) - 1 & 0xFFFF);
        } :
        function(parameters, operands) {
          var x = parameters[0].get(operands) - 1 & 0xFF;
          parameters[0].set(operands, x);
          X.CPU.zero = x == 0;
          X.CPU.addsub = true;
          X.CPU.halfcarry = (x & 0xF) == 0xF;
        };
    },

    DI: function(parameters) {
      return function(parameters, operands) {
        X.CPU.interrupt_master_enable = false; // TODO disable 1 inst after (GB man p.98)
      };
    },

    EI: function(parameters) {
      return function(parameters, operands) {
        X.CPU.interrupt_master_enable = true; // TODO same
      };
    },

    HALT: function(parameters) {
      return function(parameters, operands) {
        X.CPU.halted = true;
      };
    },

    INC: function(parameters) {
      return parameters[0] instanceof RegisterParameter && parameters[0].register.length == 2 ?
        function(parameters, operands) {
          parameters[0].set(operands, parameters[0].get(operands) + 1 & 0xFFFF);
        } :
        function(parameters, operands) {
          var x = parameters[0].get(operands) + 1 & 0xFF;
          parameters[0].set(operands, x);
          X.CPU.zero = x == 0;
          X.CPU.addsub = false;
          X.CPU.halfcarry = (x & 0xF) == 0;
        };
    },

    JP: function(parameters) {
      return parameters.length == 1 ?
        function(parameters, operands) {
          X.CPU.jump(parameters[0].get(operands));
        } :
        function(parameters, operands) {
          if (parameters[0].get(operands)) {
            X.CPU.jump(parameters[1].get(operands));
            return true;
          }
        };
    },

    JR: function(parameters) {
      return parameters.length == 1 ?
        function(parameters, operands) {
          X.CPU.jump(X.CPU.PC + X.Utils.signed(parameters[0].get(operands)));
        } :
        function(parameters, operands) {
          if (parameters[0].get(operands)) {
            X.CPU.jump(X.CPU.PC + X.Utils.signed(parameters[1].get(operands)));
            return true;
          }
        };
    },

    LD: function(parameters) {
      return function(parameters, operands) {
        parameters[0].set(operands, parameters[1].get(operands));
      };
    },

    // Special case because of the unique 16bit write in memory
    LD_nn_SP: function(parameters) {
      return function(parameters, operands) {
        var address = parameters[0].get(operands);
        X.Memory.w(address, X.Utils.lo(X.CPU.SP));
        X.Memory.w(address + 1, X.Utils.hi(X.CPU.SP));
      };
    },

    LDD: function(parameters) {
      var ld = this.LD(parameters);
      return function(parameters, operands) {
        ld(parameters, operands);
        X.CPU.HL = X.CPU.HL - 1 & 0xFFFF;
      };
    },

    LDHL: function(parameters) {
      return function(parameters, operands) {
        var a = X.CPU.SP;
        var b = X.Utils.signed(parameters[1].get(operands));
        var x = a + b;
        X.CPU.HL = x & 0xFFFF;
        X.CPU.zero = false;
        X.CPU.addsub = false;
        X.CPU.halfcarry = (a & 0xF) + (b & 0xF) > 0xF;
        X.CPU.carry = (a & 0xFF) + (b & 0xFF) > 0xFF;
      };
    },

    LDI: function(parameters) {
      var ld = this.LD(parameters);
      return function(parameters, operands) {
        ld(parameters, operands);
        X.CPU.HL = X.CPU.HL + 1 & 0xFFFF;
      };
    },

    NOP: function(parameters) {
      return function(parameters, operands) {};
    },

    OR: function(parameters) {
      return function(parameters, operands) {
        X.CPU.A |= parameters[0].get(operands);
        X.CPU.zero = X.CPU.A == 0;
        X.CPU.addsub = false;
        X.CPU.halfcarry = false;
        X.CPU.carry = false;
      };
    },

    POP: function(parameters) {
      return function(parameters, operands) {
        var lo = X.CPU.pop();
        var hi = X.CPU.pop();
        parameters[0].set(operands, X.Utils.hilo(hi, lo));
      };
    },

    PUSH: function(parameters) {
      return function(parameters, operands) {
        var pair = parameters[0].get(operands);
        X.CPU.push(X.Utils.hi(pair));
        X.CPU.push(X.Utils.lo(pair));
      };
    },

    RES: function(parameters) {
      return function(parameters, operands) {
        parameters[1].set(operands, parameters[1].get(operands) & ~(1 << parameters[0].get(operands)));
      };
    },

    RET: function(parameters) {
      return parameters.length == 1 ?
        function(parameters, operands) {
          if (parameters[0].get(operands)) {
            X.CPU.ret();
            return true;
          }
        } :
        function(parameters, operands) {
          X.CPU.ret();
        };
    },

    RETI: function(parameters) {
      return function(parameters, operands) {
        X.CPU.ret();
        X.CPU.interrupt_master_enable = true;
      };
    },

    RL: function(parameters) {
      return function(parameters, operands) {
        var x = parameters[0].get(operands);
        var bit7 = X.Utils.bit(x, 7);
        x = (x << 1 | X.CPU.carry) & 0xFF;
        parameters[0].set(operands, x);
        X.CPU.zero = x == 0;
        X.CPU.addsub = false;
        X.CPU.halfcarry = false;
        X.CPU.carry = bit7;
      };
    },

    RLA: function(parameters) {
      return function(parameters, operands) {
        var bit7 = X.Utils.bit(X.CPU.A, 7);
        X.CPU.A = (X.CPU.A << 1 | X.CPU.carry) & 0xFF;
        X.CPU.zero = false;
        X.CPU.addsub = false;
        X.CPU.halfcarry = false;
        X.CPU.carry = bit7;
      };
    },

    RLC: function(parameters) {
      return function(parameters, operands) {
        var x = parameters[0].get(operands);
        var bit7 = X.Utils.bit(x, 7);
        x = (x << 1 | bit7) & 0xFF;
        parameters[0].set(operands, x);
        X.CPU.zero = x == 0;
        X.CPU.addsub = false;
        X.CPU.halfcarry = false;
        X.CPU.carry = bit7;
      };
    },

    RLCA: function(parameters) {
      return function(parameters, operands) {
        var bit7 = X.Utils.bit(X.CPU.A, 7);
        X.CPU.A = (X.CPU.A << 1 | bit7) & 0xFF;
        X.CPU.zero = false;
        X.CPU.addsub = false;
        X.CPU.halfcarry = false;
        X.CPU.carry = bit7;
      };
    },

    RR: function(parameters) {
      return function(parameters, operands) {
        var x = parameters[0].get(operands);
        var bit0 = X.Utils.bit(x, 0);
        x = x >> 1 | X.CPU.carry << 7;
        parameters[0].set(operands, x);
        X.CPU.zero = x == 0;
        X.CPU.addsub = false;
        X.CPU.halfcarry = false;
        X.CPU.carry = bit0;
      };
    },

    RRA: function(parameters) {
      return function(parameters, operands) {
        var bit0 = X.Utils.bit(X.CPU.A, 0);
        X.CPU.A = X.CPU.A >> 1 | X.CPU.carry << 7;
        X.CPU.zero = false;
        X.CPU.addsub = false;
        X.CPU.halfcarry = false;
        X.CPU.carry = bit0;
      };
    },

    RRC: function(parameters) {
      return function(parameters, operands) {
        var x = parameters[0].get(operands);
        var bit0 = X.Utils.bit(x, 0);
        x = x >> 1 | bit0 << 7;
        parameters[0].set(operands, x);
        X.CPU.zero = x == 0;
        X.CPU.addsub = false;
        X.CPU.halfcarry = false;
        X.CPU.carry = bit0;
      };
    },

    RRCA: function(parameters) {
      return function(parameters, operands) {
        var bit0 = X.Utils.bit(X.CPU.A, 0);
        X.CPU.A = X.CPU.A >> 1 | bit0 << 7;
        X.CPU.zero = false;
        X.CPU.addsub = false;
        X.CPU.halfcarry = false;
        X.CPU.carry = bit0;
      };
    },

    RST: function(parameters) {
      return function(parameters, operands) {
        X.CPU.call(parameters[0].get(operands));
      };
    },

    SBC: function(parameters) {
      return function(parameters, operands) {
        var a = X.CPU.A;
        var b = parameters[1].get(operands);
        var x = a - b - X.CPU.carry;
        X.CPU.A = x & 0xFF;
        X.CPU.zero = X.CPU.A == 0;
        X.CPU.addsub = true;
        X.CPU.halfcarry = (a & 0xF) - (b & 0xF) - (X.CPU.carry & 0xF) < 0;
        X.CPU.carry = x < 0;
      };
    },

    SCF: function(parameters) {
      return function(parameters, operands) {
        X.CPU.addsub = false;
        X.CPU.halfcarry = false;
        X.CPU.carry = true;
      };
    },

    SET: function(parameters) {
      return function(parameters, operands) {
        parameters[1].set(operands, parameters[1].get(operands) | 1 << parameters[0].get(operands));
      };
    },

    SLA: function(parameters) {
      return function(parameters, operands) {
        var x = parameters[0].get(operands);
        var bit7 = X.Utils.bit(x, 7);
        x = x << 1 & 0xFF;
        parameters[0].set(operands, x);
        X.CPU.zero = x == 0;
        X.CPU.addsub = false;
        X.CPU.halfcarry = false;
        X.CPU.carry = bit7;
      };
    },

    SRA: function(parameters) {
      return function(parameters, operands) {
        var x = parameters[0].get(operands);
        var bit0 = X.Utils.bit(x, 0);
        var bit7 = X.Utils.bit(x, 7);
        x = x >> 1 | bit7 << 7;
        parameters[0].set(operands, x);
        X.CPU.zero = x == 0;
        X.CPU.addsub = false;
        X.CPU.halfcarry = false;
        X.CPU.carry = bit0;
      };
    },

    SRL: function(parameters) {
      return function(parameters, operands) {
        var x = parameters[0].get(operands);
        var bit0 = X.Utils.bit(x, 0);
        x >>= 1;
        parameters[0].set(operands, x);
        X.CPU.zero = x == 0;
        X.CPU.addsub = false;
        X.CPU.halfcarry = false;
        X.CPU.carry = bit0;
      };
    },

    STOP: function(parameters) {
      return function(parameters, operands) {
        console.log('STOP');
        X.CPU.stopped = true;
      };
    },

    SUB: function(parameters) {
      return function(parameters, operands) {
        var a = X.CPU.A;
        var b = parameters[0].get(operands);
        X.CPU.A = a - b & 0xFF;
        X.CPU.zero = X.CPU.A == 0;
        X.CPU.addsub = true;
        X.CPU.halfcarry = (a & 0xF) < (b & 0xF);
        X.CPU.carry = a < b;
      };
    },

    SWAP: function(parameters) {
      return function(parameters, operands) {
        var x = parameters[0].get(operands);
        x = (x & 0xF0) >> 4 | (x & 0x0F) << 4;
        parameters[0].set(operands, x);
        X.CPU.zero = x == 0;
        X.CPU.addsub = false;
        X.CPU.halfcarry = false;
        X.CPU.carry = false;
      };
    },

    XOR: function(parameters) {
      return function(parameters, operands) {
        X.CPU.A ^= parameters[0].get(operands);
        X.CPU.zero = X.CPU.A == 0;
        X.CPU.addsub = false;
        X.CPU.halfcarry = false;
        X.CPU.carry = false;
      };
    }
  };

  return {

    /**
      *
      */

    generate: function() {

      return _.map(opcode_specs, function(specs, opcode) {

        if (!specs)
          return null;

        var instruction = generate_instruction(opcode, specs);

        console.info('Generated instruction ' + (opcode > 0xFF ? 'CB ' : '') + X.Utils.hex8(opcode) + ': ' + instruction.to_string());

        return instruction;
      });
    }

  };

})();
