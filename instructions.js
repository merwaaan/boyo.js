var X = X || {};

X.InstructionImplementations = (function() {

  'use strict'

  /**
    *
    * Instruction implementations
    *
    */
    
  return {

    /**
      *
      * List of opcodes fetched from http://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html
      *
      */

    opcodes: [['NOP', '1', '4'], ['LD BC,d16', '3', '12'], ['LD (BC),A', '1', '8'], ['INC BC', '1', '8'], ['INC B', '1', '4'], ['DEC B', '1', '4'], ['LD B,d8', '2', '8'], ['RLCA', '1', '4'], ['LD (a16),SP', '3', '20'], ['ADD HL,BC', '1', '8'], ['LD A,(BC)', '1', '8'], ['DEC BC', '1', '8'], ['INC C', '1', '4'], ['DEC C', '1', '4'], ['LD C,d8', '2', '8'], ['RRCA', '1', '4'], ['STOP 0', '2', '4'], ['LD DE,d16', '3', '12'], ['LD (DE),A', '1', '8'], ['INC DE', '1', '8'], ['INC D', '1', '4'], ['DEC D', '1', '4'], ['LD D,d8', '2', '8'], ['RLA', '1', '4'], ['JR r8', '2', '12'], ['ADD HL,DE', '1', '8'], ['LD A,(DE)', '1', '8'], ['DEC DE', '1', '8'], ['INC E', '1', '4'], ['DEC E', '1', '4'], ['LD E,d8', '2', '8'], ['RRA', '1', '4'], ['JR fNZ,r8', '2', '12/8'], ['LD HL,d16', '3', '12'], ['LDI (HL),A', '1', '8'], ['INC HL', '1', '8'], ['INC H', '1', '4'], ['DEC H', '1', '4'], ['LD H,d8', '2', '8'], ['DAA', '1', '4'], ['JR fZ,r8', '2', '12/8'], ['ADD HL,HL', '1', '8'], ['LDI A,(HL)', '1', '8'], ['DEC HL', '1', '8'], ['INC L', '1', '4'], ['DEC L', '1', '4'], ['LD L,d8', '2', '8'], ['CPL', '1', '4'], ['JR fNC,r8', '2', '12/8'], ['LD SP,d16', '3', '12'], ['LDD (HL),A', '1', '8'], ['INC SP', '1', '8'], ['INC (HL)', '1', '12'], ['DEC (HL)', '1', '12'], ['LD (HL),d8', '2', '12'], ['SCF', '1', '4'], ['JR fC,r8', '2', '12/8'], ['ADD HL,SP', '1', '8'], ['LDD A,(HL)', '1', '8'], ['DEC SP', '1', '8'], ['INC A', '1', '4'], ['DEC A', '1', '4'], ['LD A,d8', '2', '8'], ['CCF', '1', '4'], ['LD B,B', '1', '4'], ['LD B,C', '1', '4'], ['LD B,D', '1', '4'], ['LD B,E', '1', '4'], ['LD B,H', '1', '4'], ['LD B,L', '1', '4'], ['LD B,(HL)', '1', '8'], ['LD B,A', '1', '4'], ['LD C,B', '1', '4'], ['LD C,C', '1', '4'], ['LD C,D', '1', '4'], ['LD C,E', '1', '4'], ['LD C,H', '1', '4'], ['LD C,L', '1', '4'], ['LD C,(HL)', '1', '8'], ['LD C,A', '1', '4'], ['LD D,B', '1', '4'], ['LD D,C', '1', '4'], ['LD D,D', '1', '4'], ['LD D,E', '1', '4'], ['LD D,H', '1', '4'], ['LD D,L', '1', '4'], ['LD D,(HL)', '1', '8'], ['LD D,A', '1', '4'], ['LD E,B', '1', '4'], ['LD E,C', '1', '4'], ['LD E,D', '1', '4'], ['LD E,E', '1', '4'], ['LD E,H', '1', '4'], ['LD E,L', '1', '4'], ['LD E,(HL)', '1', '8'], ['LD E,A', '1', '4'], ['LD H,B', '1', '4'], ['LD H,C', '1', '4'], ['LD H,D', '1', '4'], ['LD H,E', '1', '4'], ['LD H,H', '1', '4'], ['LD H,L', '1', '4'], ['LD H,(HL)', '1', '8'], ['LD H,A', '1', '4'], ['LD L,B', '1', '4'], ['LD L,C', '1', '4'], ['LD L,D', '1', '4'], ['LD L,E', '1', '4'], ['LD L,H', '1', '4'], ['LD L,L', '1', '4'], ['LD L,(HL)', '1', '8'], ['LD L,A', '1', '4'], ['LD (HL),B', '1', '8'], ['LD (HL),C', '1', '8'], ['LD (HL),D', '1', '8'], ['LD (HL),E', '1', '8'], ['LD (HL),H', '1', '8'], ['LD (HL),L', '1', '8'], ['HALT', '1', '4'], ['LD (HL),A', '1', '8'], ['LD A,B', '1', '4'], ['LD A,C', '1', '4'], ['LD A,D', '1', '4'], ['LD A,E', '1', '4'], ['LD A,H', '1', '4'], ['LD A,L', '1', '4'], ['LD A,(HL)', '1', '8'], ['LD A,A', '1', '4'], ['ADD A,B', '1', '4'], ['ADD A,C', '1', '4'], ['ADD A,D', '1', '4'], ['ADD A,E', '1', '4'], ['ADD A,H', '1', '4'], ['ADD A,L', '1', '4'], ['ADD A,(HL)', '1', '8'], ['ADD A,A', '1', '4'], ['ADC A,B', '1', '4'], ['ADC A,C', '1', '4'], ['ADC A,D', '1', '4'], ['ADC A,E', '1', '4'], ['ADC A,H', '1', '4'], ['ADC A,L', '1', '4'], ['ADC A,(HL)', '1', '8'], ['ADC A,A', '1', '4'], ['SUB B', '1', '4'], ['SUB C', '1', '4'], ['SUB D', '1', '4'], ['SUB E', '1', '4'], ['SUB H', '1', '4'], ['SUB L', '1', '4'], ['SUB (HL)', '1', '8'], ['SUB A', '1', '4'], ['SBC A,B', '1', '4'], ['SBC A,C', '1', '4'], ['SBC A,D', '1', '4'], ['SBC A,E', '1', '4'], ['SBC A,H', '1', '4'], ['SBC A,L', '1', '4'], ['SBC A,(HL)', '1', '8'], ['SBC A,A', '1', '4'], ['AND B', '1', '4'], ['AND C', '1', '4'], ['AND D', '1', '4'], ['AND E', '1', '4'], ['AND H', '1', '4'], ['AND L', '1', '4'], ['AND (HL)', '1', '8'], ['AND A', '1', '4'], ['XOR B', '1', '4'], ['XOR C', '1', '4'], ['XOR D', '1', '4'], ['XOR E', '1', '4'], ['XOR H', '1', '4'], ['XOR L', '1', '4'], ['XOR (HL)', '1', '8'], ['XOR A', '1', '4'], ['OR B', '1', '4'], ['OR C', '1', '4'], ['OR D', '1', '4'], ['OR E', '1', '4'], ['OR H', '1', '4'], ['OR L', '1', '4'], ['OR (HL)', '1', '8'], ['OR A', '1', '4'], ['CP B', '1', '4'], ['CP C', '1', '4'], ['CP D', '1', '4'], ['CP E', '1', '4'], ['CP H', '1', '4'], ['CP L', '1', '4'], ['CP (HL)', '1', '8'], ['CP A', '1', '4'], ['RET fNZ', '1', '20/8'], ['POP BC', '1', '12'], ['JP fNZ,a16', '3', '16/12'], ['JP a16', '3', '16'], ['CALL fNZ,a16', '3', '24/12'], ['PUSH BC', '1', '16'], ['ADD A,d8', '2', '8'], ['RST 00H', '1', '16'], ['RET fZ', '1', '20/8'], ['RET', '1', '16'], ['JP fZ,a16', '3', '16/12'], null, ['CALL fZ,a16', '3', '24/12'], ['CALL a16', '3', '24'], ['ADC A,d8', '2', '8'], ['RST 08H', '1', '16'], ['RET fNC', '1', '20/8'], ['POP DE', '1', '12'], ['JP fNC,a16', '3', '16/12'], null, ['CALL fNC,a16', '3', '24/12'], ['PUSH DE', '1', '16'], ['SUB d8', '2', '8'], ['RST 10H', '1', '16'], ['RET fC', '1', '20/8'], ['RETI', '1', '16'], ['JP fC,a16', '3', '16/12'], null, ['CALL fC,a16', '3', '24/12'], null, ['SBC A,d8', '2', '8'], ['RST 18H', '1', '16'], ['LD ($FF00+a8),A', '2', '12'], ['POP HL', '1', '12'], ['LD ($FF00+C),A', 1, '8'], null, null, ['PUSH HL', '1', '16'], ['AND d8', '2', '8'], ['RST 20H', '1', '16'], ['ADD SP,r8', '2', '16'], ['JP (HL)', '1', '4'], ['LD (a16),A', '3', '16'], null, null, null, ['XOR d8', '2', '8'], ['RST 28H', '1', '16'], ['LD A,($FF00+a8)', '2', '12'], ['POP AF', '1', '12'], ['LD A,($FF00+C)', 1, '8'], ['DI', '1', '4'], null, ['PUSH AF', '1', '16'], ['OR d8', '2', '8'], ['RST 30H', '1', '16'], ['LD HL,SP+r8', '2', '12'], ['LD SP,HL', '1', '8'], ['LD A,(a16)', '3', '16'], ['EI', '1', '4'], null, null, ['CP d8', '2', '8'], ['RST 38H', '1', '16'], ['RLC B', '2', '8'], ['RLC C', '2', '8'], ['RLC D', '2', '8'], ['RLC E', '2', '8'], ['RLC H', '2', '8'], ['RLC L', '2', '8'], ['RLC (HL)', '2', '16'], ['RLC A', '2', '8'], ['RRC B', '2', '8'], ['RRC C', '2', '8'], ['RRC D', '2', '8'], ['RRC E', '2', '8'], ['RRC H', '2', '8'], ['RRC L', '2', '8'], ['RRC (HL)', '2', '16'], ['RRC A', '2', '8'], ['RL B', '2', '8'], ['RL C', '2', '8'], ['RL D', '2', '8'], ['RL E', '2', '8'], ['RL H', '2', '8'], ['RL L', '2', '8'], ['RL (HL)', '2', '16'], ['RL A', '2', '8'], ['RR B', '2', '8'], ['RR C', '2', '8'], ['RR D', '2', '8'], ['RR E', '2', '8'], ['RR H', '2', '8'], ['RR L', '2', '8'], ['RR (HL)', '2', '16'], ['RR A', '2', '8'], ['SLA B', '2', '8'], ['SLA C', '2', '8'], ['SLA D', '2', '8'], ['SLA E', '2', '8'], ['SLA H', '2', '8'], ['SLA L', '2', '8'], ['SLA (HL)', '2', '16'], ['SLA A', '2', '8'], ['SRA B', '2', '8'], ['SRA C', '2', '8'], ['SRA D', '2', '8'], ['SRA E', '2', '8'], ['SRA H', '2', '8'], ['SRA L', '2', '8'], ['SRA (HL)', '2', '16'], ['SRA A', '2', '8'], ['SWAP B', '2', '8'], ['SWAP C', '2', '8'], ['SWAP D', '2', '8'], ['SWAP E', '2', '8'], ['SWAP H', '2', '8'], ['SWAP L', '2', '8'], ['SWAP (HL)', '2', '16'], ['SWAP A', '2', '8'], ['SRL B', '2', '8'], ['SRL C', '2', '8'], ['SRL D', '2', '8'], ['SRL E', '2', '8'], ['SRL H', '2', '8'], ['SRL L', '2', '8'], ['SRL (HL)', '2', '16'], ['SRL A', '2', '8'], ['BIT 0,B', '2', '8'], ['BIT 0,C', '2', '8'], ['BIT 0,D', '2', '8'], ['BIT 0,E', '2', '8'], ['BIT 0,H', '2', '8'], ['BIT 0,L', '2', '8'], ['BIT 0,(HL)', '2', '16'], ['BIT 0,A', '2', '8'], ['BIT 1,B', '2', '8'], ['BIT 1,C', '2', '8'], ['BIT 1,D', '2', '8'], ['BIT 1,E', '2', '8'], ['BIT 1,H', '2', '8'], ['BIT 1,L', '2', '8'], ['BIT 1,(HL)', '2', '16'], ['BIT 1,A', '2', '8'], ['BIT 2,B', '2', '8'], ['BIT 2,C', '2', '8'], ['BIT 2,D', '2', '8'], ['BIT 2,E', '2', '8'], ['BIT 2,H', '2', '8'], ['BIT 2,L', '2', '8'], ['BIT 2,(HL)', '2', '16'], ['BIT 2,A', '2', '8'], ['BIT 3,B', '2', '8'], ['BIT 3,C', '2', '8'], ['BIT 3,D', '2', '8'], ['BIT 3,E', '2', '8'], ['BIT 3,H', '2', '8'], ['BIT 3,L', '2', '8'], ['BIT 3,(HL)', '2', '16'], ['BIT 3,A', '2', '8'], ['BIT 4,B', '2', '8'], ['BIT 4,C', '2', '8'], ['BIT 4,D', '2', '8'], ['BIT 4,E', '2', '8'], ['BIT 4,H', '2', '8'], ['BIT 4,L', '2', '8'], ['BIT 4,(HL)', '2', '16'], ['BIT 4,A', '2', '8'], ['BIT 5,B', '2', '8'], ['BIT 5,C', '2', '8'], ['BIT 5,D', '2', '8'], ['BIT 5,E', '2', '8'], ['BIT 5,H', '2', '8'], ['BIT 5,L', '2', '8'], ['BIT 5,(HL)', '2', '16'], ['BIT 5,A', '2', '8'], ['BIT 6,B', '2', '8'], ['BIT 6,C', '2', '8'], ['BIT 6,D', '2', '8'], ['BIT 6,E', '2', '8'], ['BIT 6,H', '2', '8'], ['BIT 6,L', '2', '8'], ['BIT 6,(HL)', '2', '16'], ['BIT 6,A', '2', '8'], ['BIT 7,B', '2', '8'], ['BIT 7,C', '2', '8'], ['BIT 7,D', '2', '8'], ['BIT 7,E', '2', '8'], ['BIT 7,H', '2', '8'], ['BIT 7,L', '2', '8'], ['BIT 7,(HL)', '2', '16'], ['BIT 7,A', '2', '8'], ['RES 0,B', '2', '8'], ['RES 0,C', '2', '8'], ['RES 0,D', '2', '8'], ['RES 0,E', '2', '8'], ['RES 0,H', '2', '8'], ['RES 0,L', '2', '8'], ['RES 0,(HL)', '2', '16'], ['RES 0,A', '2', '8'], ['RES 1,B', '2', '8'], ['RES 1,C', '2', '8'], ['RES 1,D', '2', '8'], ['RES 1,E', '2', '8'], ['RES 1,H', '2', '8'], ['RES 1,L', '2', '8'], ['RES 1,(HL)', '2', '16'], ['RES 1,A', '2', '8'], ['RES 2,B', '2', '8'], ['RES 2,C', '2', '8'], ['RES 2,D', '2', '8'], ['RES 2,E', '2', '8'], ['RES 2,H', '2', '8'], ['RES 2,L', '2', '8'], ['RES 2,(HL)', '2', '16'], ['RES 2,A', '2', '8'], ['RES 3,B', '2', '8'], ['RES 3,C', '2', '8'], ['RES 3,D', '2', '8'], ['RES 3,E', '2', '8'], ['RES 3,H', '2', '8'], ['RES 3,L', '2', '8'], ['RES 3,(HL)', '2', '16'], ['RES 3,A', '2', '8'], ['RES 4,B', '2', '8'], ['RES 4,C', '2', '8'], ['RES 4,D', '2', '8'], ['RES 4,E', '2', '8'], ['RES 4,H', '2', '8'], ['RES 4,L', '2', '8'], ['RES 4,(HL)', '2', '16'], ['RES 4,A', '2', '8'], ['RES 5,B', '2', '8'], ['RES 5,C', '2', '8'], ['RES 5,D', '2', '8'], ['RES 5,E', '2', '8'], ['RES 5,H', '2', '8'], ['RES 5,L', '2', '8'], ['RES 5,(HL)', '2', '16'], ['RES 5,A', '2', '8'], ['RES 6,B', '2', '8'], ['RES 6,C', '2', '8'], ['RES 6,D', '2', '8'], ['RES 6,E', '2', '8'], ['RES 6,H', '2', '8'], ['RES 6,L', '2', '8'], ['RES 6,(HL)', '2', '16'], ['RES 6,A', '2', '8'], ['RES 7,B', '2', '8'], ['RES 7,C', '2', '8'], ['RES 7,D', '2', '8'], ['RES 7,E', '2', '8'], ['RES 7,H', '2', '8'], ['RES 7,L', '2', '8'], ['RES 7,(HL)', '2', '16'], ['RES 7,A', '2', '8'], ['SET 0,B', '2', '8'], ['SET 0,C', '2', '8'], ['SET 0,D', '2', '8'], ['SET 0,E', '2', '8'], ['SET 0,H', '2', '8'], ['SET 0,L', '2', '8'], ['SET 0,(HL)', '2', '16'], ['SET 0,A', '2', '8'], ['SET 1,B', '2', '8'], ['SET 1,C', '2', '8'], ['SET 1,D', '2', '8'], ['SET 1,E', '2', '8'], ['SET 1,H', '2', '8'], ['SET 1,L', '2', '8'], ['SET 1,(HL)', '2', '16'], ['SET 1,A', '2', '8'], ['SET 2,B', '2', '8'], ['SET 2,C', '2', '8'], ['SET 2,D', '2', '8'], ['SET 2,E', '2', '8'], ['SET 2,H', '2', '8'], ['SET 2,L', '2', '8'], ['SET 2,(HL)', '2', '16'], ['SET 2,A', '2', '8'], ['SET 3,B', '2', '8'], ['SET 3,C', '2', '8'], ['SET 3,D', '2', '8'], ['SET 3,E', '2', '8'], ['SET 3,H', '2', '8'], ['SET 3,L', '2', '8'], ['SET 3,(HL)', '2', '16'], ['SET 3,A', '2', '8'], ['SET 4,B', '2', '8'], ['SET 4,C', '2', '8'], ['SET 4,D', '2', '8'], ['SET 4,E', '2', '8'], ['SET 4,H', '2', '8'], ['SET 4,L', '2', '8'], ['SET 4,(HL)', '2', '16'], ['SET 4,A', '2', '8'], ['SET 5,B', '2', '8'], ['SET 5,C', '2', '8'], ['SET 5,D', '2', '8'], ['SET 5,E', '2', '8'], ['SET 5,H', '2', '8'], ['SET 5,L', '2', '8'], ['SET 5,(HL)', '2', '16'], ['SET 5,A', '2', '8'], ['SET 6,B', '2', '8'], ['SET 6,C', '2', '8'], ['SET 6,D', '2', '8'], ['SET 6,E', '2', '8'], ['SET 6,H', '2', '8'], ['SET 6,L', '2', '8'], ['SET 6,(HL)', '2', '16'], ['SET 6,A', '2', '8'], ['SET 7,B', '2', '8'], ['SET 7,C', '2', '8'], ['SET 7,D', '2', '8'], ['SET 7,E', '2', '8'], ['SET 7,H', '2', '8'], ['SET 7,L', '2', '8'], ['SET 7,(HL)', '2', '16'], ['SET 7,A', '2', '8']],

    /**
      *
      *
      *
      */
      
    generate: function(cpu) {

      return this.opcodes.map(function(specs, opcode) {
        return specs ? this.generate_instruction(cpu, opcode, specs) : null;
      }, this);
    },
    
    /**
      *
      *
      *
      */
    
    generate_instruction: function(cpu, opcode, specs) {

      var parts = specs[0].split(' ');
      var instruction_name = parts[0];
      var parameter_names = parts[1];

      var parameters = parameter_names ?
        parameter_names.split(',').map(function(parameter_name) {
          return this.generate_parameter(cpu, opcode, parameter_name);
        }, this) :
        null;

      return this[instruction_name](parameters);
    },

    /**
      *
      *
      *
      */
      
    generate_parameter: function(cpu, opcode, parameter_name) {
      
      // Special cases
      // TODO handle those cleanly

      if (parameter_name == 'SP+r8') { // Weird LD
        return {
          get: function(operands) { return cpu.SP + operands[0]; }
        };
      }

      // Common cases
      
      var parameter = null;

      var core = parameter_name.match(/^\(?(.+?)\)?$/)[1];

      if (core.match(/^[A-Z]+$/)) { // Register
        parameter = {
          get: function(operands) { return cpu[core]; },
          set: function(operands, value) { cpu[core] = value; }
        };
      }
      else if (core.match(/^(d8|a8|r8)$/)) { // Immediate 8-bit value
        parameter = {
          get: function(operands) { return operands[0]; },
        };
      }
      else if (core.match(/^(d16|a16)$/)) { // Immediate 16-bit value
        parameter = {
          get: function(operands) { return X.Utils.hilo(operands[1], operands[0]); },
        };
      }
      else if (core.match(/^[0-7]$/)) { // Bit
        var b = parseInt(core);
        parameter = {
          get: function(operands) { return b; }
        };
      }    
      else if (core.match(/^[0-3][0|8]H$/)) { // Offset from $0000
        return {
          get: function(operands) { return parseInt(parameter_name, 16); }
        };
      }
      else if (core.match(/^\$FF00\+(C|a8)$/)) { // Zero-page
        var p = this.generate_parameter(cpu, opcode, _.last(core) === 'C' ? 'C' : 'a8');
        parameter = {
          get: function(operands) { return 0xFF00 + p.get(operands); }
        };
      }
      else if (core.match(/^fN?[CZ]$/)) { // Flag status condition
        var state = parameter_name[1] == 'N' ? false : true;
        var flag = _.last(parameter_name) == 'Z' ? 'zero' : 'carry';
        parameter = {
          get: function(operands) { return cpu[flag] == state; }
        };
      }
      
      else {
        console.log('Unrecognized opcode, that\'s not supposed to happen', parameter_name, core);
      }
      
      // If the parameter is between parentheses, add a layer of indirection
      
      if (parameter_name[0] == '(') {
        return {
          get: function(operands) { return cpu.memory[parameter.get(operands)]; },
          set: function(operands, value) { cpu.memory[parameter.get(operands)] = value; }
        };
      }
      
      return parameter;
    },
    
    /**
      *
      * Implementations
      *
      */
    
    'ADC': function(parameters) {
      return function(cpu, operands) {
        parameters[0].set(parameters[0].get(operands) + parameters[1].get(operands) + cpu.carry); // TODO wrap???
        cpu.flags = [cpu.A === 0, false, true, true]; // TODO H,C
      };
    },
    
    'ADD': function(parameters) {
      return function(cpu, operands) {
        parameters[0].set(parameters[0].get(operands) + parameters[1].get(operands)); // TODO wrap???
        cpu.flags = [cpu.A === 0, false, true, true]; // TODO H,C
      };
    },
    
    'AND': function(parameters) {
      return function(cpu, operands) {
        cpu.A &= parameters[0].get(operands);
        cpu.flags = [cpu.A === 0, false, true, false];
      };
    },
    
    'BIT': function(parameters) {
      return function(cpu, operands) {
        cpu.flags = [!X.Utils.nth_bit(parameters[1].get(), parameters[0].get()), false, true, undefined];
      };
    },
    
    'CALL': function(parameters) {
      return function(cpu, operands) {
        cpu.push(cpu.PC);
        cpu.PC = parameters[0].get(operands);
      };
    },
    
    'CCF': function(parameters) {
      return function(cpu, operands) {
        cpu.carry = !cpu.carry;
      };
    },
    
    'CP': function(parameters) {
      return function(cpu, operands) {
        var sub = cpu.A - parameters[0].get(operands);
        cpu.zero = true; // TODO
        cpu.addsub = true;
        cpu.halfcarry = true; // TODO
        cpu.Carry = true; // TODO
      };
    },
    
    'CPL': function(parameters) {
      return function(cpu, operands) {
        cpu.A = ~cpu.A;
        cpu.flags = [undefined, true, true, undefined];
      };
    },
    
    'DAA': function(parameters) {
      return function(cpu, operands) {
        // Nothing
        cpu.zero = cpu.A == 0;
        cpu.halfcarry = false;
        cpu.carry = true; // TODO
      };
    },
    
    'DEC': function(parameters) {
      return function(cpu, operands) {
        parameters[0].set(operands, parameters[0].get(operands) - 1); // TODO wrap???
      };
    },
    
    'DI': function(parameters) {
      return function(cpu, operands) {
        // Disable interrupts (after the following instruction???)
      };
    },
    
    'EI': function(parameters) {
      return function(cpu, operands) {
        // Enable interrupts (same???)
      };
    },
    
    'HALT': function(parameters) {
      return function(cpu, operands) {
        console.log('HALT');
      };
    },
    
    'INC': function(parameters) {
      return function(cpu, operands) {
        parameters[0].set(operands, parameters[0].get(operands) + 1); // TODO wrap???
        cpu.flags = [parameters[0].get(operands) === 0, false, true, undefined]; // TODO HC
      };
    },
    
    'JP': function(parameters) {
      return parameters.length == 1 ?
        function(cpu, operands) {
          cpu.PC = parameters[0].get(operands);
        } :
        function(cpu, operands) {
          if (parameters[0].get(operands)) {
            cpu.PC += X.Utils.signed(parameters[1].get(operands));
          }
        };
    },
    
    'JR': function(parameters) {
      return parameters.length == 1 ?
        function(cpu, operands) {
          cpu.PC += X.Utils.signed(parameters[0].get(operands));
        } :
        function(cpu, operands) {
          if (parameters[0].get(operands)) {
            cpu.PC += X.Utils.signed(parameters[1].get(operands));
          }
        };
    },
    
    'LD': function(parameters) {
      return function(cpu, operands) {
        parameters[0].set(operands, parameters[1].get(operands));
      };
    },
    
    'LDD': function(parameters) {
      var ld = this.LD(parameters);
      return function(cpu, operands) {
        ld(cpu, operands);
        cpu.HL = cpu.HL - 1;
      };
    },
    
    'LDI': function(parameters) {
      var ld = this.LD(parameters);
      return function(cpu, operands) {
        ld(cpu, operands);
        cpu.HL = cpu.HL + 1;
      };
    },
    
    'NOP': function(parameters) {
      return function(cpu, operands) { };
    },
    
    'OR': function(parameters) {
      return function(cpu, operands) {
        cpu.A |= parameters[0].get(operands);
        cpu.flags = [cpu.flags == 0, false, false, false];
      };
    },
    
    'POP': function(parameters) {
      return function(cpu, operands) {
        var lo = cpu.pop();
        var hi = cpu.pop();
        parameters[0].set(X.Utils.hilo(hi, lo));
      };
    },
    
    'PUSH': function(parameters) { // TODO
      return function(cpu, operands) {
        var pair = parameters[0].get(operands);
        cpu.push(parameters[0].get(X.Utils.hi(pair)));
        cpu.push(parameters[1].get(X.Utils.lo(pair)));
      };
    },
    
    'RES': function(parameters) {
      return function(cpu, operands) {
        parameters[1].set(operands, parameters[1].get(operands) & ~(1 << parameters[0].get(operands)));
      };
    },
    
    'RET': function(parameters) {
      return parameters === undefined ?
        function(cpu, operands) {
          var hi = cpu.pop();
          var lo = cpu.pop();
          cpu.PC = X.Utils.hilo(hi, lo);
        } :
        function(cpu, operands) {
          if (parameters[0].get(operands)) {
            var hi = cpu.pop();
            var lo = cpu.pop();
            cpu.PC = X.Utils.hilo(hi, lo);
          }
        };
    },
    
    'RETI': function(parameters) {
      var ret = this.RET(parameters);
      return function(cpu, operands) {
        ret(cpu, operands);
        // enable interrupts
      };
    },
    
    'RL': function(parameters) {
      return function(cpu, operands) {
        var bit7 = X.Utils.nth_bit(parameters[0].get(operands), 7);
        parameters[0].set(operands, parameters[0].get(operands) << 1 | cpu.carry);
        cpu.flags = [parameters[0].get(operands) === 0, false, false, bit7];
      };
    },
    
    'RLA': function(parameters) {
      return function(cpu, operands) {
        var bit7 = X.Utils.nth_bit(cpu.A, 7);
        cpu.A <<= 1;
        cpu.A |= cpu.carry;
        cpu.flags = [cpu.A === 0, false, false, bit7];
      };
    },
    
    'RLC': function(parameters) {
      return function(cpu, operands) {
        // Nothing
      };
    },
    
    'RLCA': function(parameters) {
      return function(cpu, operands) {
        var bit7 = X.Utils.nth_bit(cpu.A, 7);
        cpu.A <<= 1;
        cpu.A |= bit7;
        cpu.flags = [cpu.A === 0, false, false, bit7];
      };
    },
    
    'RR': function(parameters) {
      return function(cpu, operands) {
        var bit0 = X.Utils.nth_bit(parameters[0].get(operands), 0);
        parameters[0].set(operands, parameters[0].get(operands) >> 1 | cpu.carry << 7);
        cpu.flags = [parameters[0].get(operands) === 0, false, false, bit0];
      };
    },
    
    'RRA': function(parameters) {
      return function(cpu, operands) {
        var bit0 = X.Utils.nth_bit(cpu.A, 0);
        cpu.A >>= 1;
        cpu.A |= cpu.carry << 7;
        cpu.flags = [cpu.A === 0, false, false, bit0];
      };
    },
    
    'RRC': function(parameters) {
      return function(cpu, operands) {
        // Nothing
      };
    },
    
    'RRCA': function(parameters) {
      return function(cpu, operands) {
        var bit0 = X.Utils.nth_bit(cpu.A, 0);
        cpu.A >>= 1;
        cpu.A |= bit0 << 7;
        cpu.flags = [cpu.A === 0, false, false, bit0];
      };
    },
    
    'RST': function(parameters) {
      return function(cpu, operands) {
        cpu.push(cpu.PC);
        cpu.PC = parameters[0].get(operands);
      };
    },
    
    'SBC': function(parameters) {
      return function(cpu, operands) {
        parameters[0].set(operands, parameters[0].get(operands) - parameters[1].get(operands) - cpu.carry); // TODO wrap???
        cpu.flags = [cpu.A === 0, true, true, true]; // TODO H,C
      };
    },
    
    'SCF': function(parameters) {
      return function(cpu, operands) {
        cpu.carry = true;
      };
    },
    
    'SET': function(parameters) {
      return function(cpu, operands) {
        parameters[1].set(operands, parameters[1].get(operands) | 1 << parameters[0].get(operands));
      };
    },
    
    'SLA': function(parameters) {// TODO bit 7 should not change??? (>>> ??)
      return function(cpu, operands) {
        var x = parameters[0].get(operands);
        var bit7 = Utils.nth_bit(x, 7);
        x << 1;
        parameters[0].set(operands, x);
        cpu.flags = [x === 0, false, false, bit7];
      };
    },
    
    'SRA': function(parameters) {
      return function(cpu, operands) { // TODO bit 7 should not change??? (>>> ??)
        var x = parameters[0].get(operands);
        var bit0 = Utils.nth_bit(x, 0);
        x >> 1;
        parameters[0].set(operands, x);
        cpu.flags = [x === 0, false, false, bit0];
      };
    },
    
    'SRL': function(parameters) {// TODO bit 7 should not change??? (>>> ??)
      return function(cpu, operands) {
        var x = parameters[0].get(operands);
        var bit0 = Utils.nth_bit(x, 0);
        x >> 1;
        parameters[0].set(operands, x);
        cpu.flags = [x === 0, false, false, bit0];
      };
    },
    
    'STOP': function(parameters) {
      return function(cpu, operands) {
        console.log('STOP');
      };
    },
    
    'SUB': function(parameters) {
      return function(cpu, operands) {
        cpu.A = cpu.A - parameters[0].get(operands);
        cpu.flags = [cpu.A === 0, true, true, true]; // TODO H,C
      };
    },
    
    'SWAP': function(parameters) {
      return function(cpu, operands) {
        var x = parameters[0].get(operands);
        x = (x & 0xF0 >> 4) | (x & 0x0F << 4);
        parameters[0].set(operands, x);
        cpu.flags = [x === 0, false, false, false];
      };
    },
    
    'XOR': function(parameters) {
      return function(cpu, operands) {
        cpu.A ^= parameters[0].get(operands);
        cpu.flags = [cpu.A === 0, false, false, false];
      };
    }
    
  };

})();
