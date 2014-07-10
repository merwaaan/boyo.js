var X = X || {};

X.CPU = {

  memory: new Array(0x10000),

  /**
    * Registers
    */

  PC: 0,
  SP: 0,
  
  A: 0,
  B: 0,
  C: 0,
  D: 0,
  E: 0,
  F: 0,
  H: 0,
  L: 0,  
  get AF() { return X.Utils.hilo(this.A, this.F); },
  get BC() { return X.Utils.hilo(this.B, this.C); },
  get DE() { return X.Utils.hilo(this.D, this.E); },
  get HL() { return X.Utils.hilo(this.H, this.L); },
 
  get_flag: function(mask) { return !!(this.F & mask); },
  set_flag: function(mask, set) { set ? this.F |= mask : this.F &= ~mask; },

  Flags: {
    CARRY: 1 << 4,
    HALFCARRY: 1 << 5,
    SUBSTRACT: 1 << 6,
    ZERO: 1 << 7
  },

  /**
    * Instructions
    */

  bios: [0x31, 0xfe, 0xff, 0xaf, 0x21, 0xff, 0x9f, 0x32, 0xcb, 0x7c, 0x20, 0xfb, 0x21, 0x26, 0xff, 0xe, 0x11, 0x3e, 0x80, 0x32, 0xe2, 0xc, 0x3e, 0xf3, 0xe2, 0x32, 0x3e, 0x77, 0x77, 0x3e, 0xfc, 0xe0, 0x47, 0x11, 0x4, 0x1, 0x21, 0x10, 0x80, 0x1a, 0xcd, 0x95, 0x0, 0xcd, 0x96, 0x0, 0x13, 0x7b, 0xfe, 0x34, 0x20, 0xf3, 0x11, 0xd8, 0x0, 0x6, 0x8, 0x1a, 0x13, 0x22, 0x23, 0x5, 0x20, 0xf9, 0x3e, 0x19, 0xea, 0x10, 0x99, 0x21, 0x2f, 0x99, 0xe, 0xc, 0x3d, 0x28, 0x8, 0x32, 0xd, 0x20, 0xf9, 0x2e, 0xf, 0x18, 0xf3, 0x67, 0x3e, 0x64, 0x57, 0xe0, 0x42, 0x3e, 0x91, 0xe0, 0x40, 0x4, 0x1e, 0x2, 0xe, 0xc, 0xf0, 0x44, 0xfe, 0x90, 0x20, 0xfa, 0xd, 0x20, 0xf7, 0x1d, 0x20, 0xf2, 0xe, 0x13, 0x24, 0x7c, 0x1e, 0x83, 0xfe, 0x62, 0x28, 0x6, 0x1e, 0xc1, 0xfe, 0x64, 0x20, 0x6, 0x7b, 0xe2, 0xc, 0x3e, 0x87, 0xe2, 0xf0, 0x42, 0x90, 0xe0, 0x42, 0x15, 0x20, 0xd2, 0x5, 0x20, 0x4f, 0x16, 0x20, 0x18, 0xcb, 0x4f, 0x6, 0x4, 0xc5, 0xcb, 0x11, 0x17, 0xc1, 0xcb, 0x11, 0x17, 0x5, 0x20, 0xf5, 0x22, 0x23, 0x22, 0x23, 0xc9, 0xce, 0xed, 0x66, 0x66, 0xcc, 0xd, 0x0, 0xb, 0x3, 0x73, 0x0, 0x83, 0x0, 0xc, 0x0, 0xd, 0x0, 0x8, 0x11, 0x1f, 0x88, 0x89, 0x0, 0xe, 0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99, 0xbb, 0xbb, 0x67, 0x63, 0x6e, 0xe, 0xec, 0xcc, 0xdd, 0xdc, 0x99, 0x9f, 0xbb, 0xb9, 0x33, 0x3e, 0x3c, 0x42, 0xb9, 0xa5, 0xb9, 0xa5, 0x42, 0x3c, 0x21, 0x4, 0x1, 0x11, 0xa8, 0x0, 0x1a, 0x13, 0xbe, 0x20, 0xfe, 0x23, 0x7d, 0xfe, 0x34, 0x20, 0xf5, 0x6, 0x19, 0x78, 0x86, 0x23, 0x5, 0x20, 0xfb, 0x86, 0x20, 0xfe, 0x3e, 0x1, 0xe0, 0x50],
  opcodes: [['NOP', '1', '4'], ['LD BC,d16', '3', '12'], ['LD (BC),A', '1', '8'], ['INC BC', '1', '8'], ['INC B', '1', '4'], ['DEC B', '1', '4'], ['LD B,d8', '2', '8'], ['RLCA', '1', '4'], ['LD (a16),SP', '3', '20'], ['ADD HL,BC', '1', '8'], ['LD A,(BC)', '1', '8'], ['DEC BC', '1', '8'], ['INC C', '1', '4'], ['DEC C', '1', '4'], ['LD C,d8', '2', '8'], ['RRCA', '1', '4'], ['STOP 0', '2', '4'], ['LD DE,d16', '3', '12'], ['LD (DE),A', '1', '8'], ['INC DE', '1', '8'], ['INC D', '1', '4'], ['DEC D', '1', '4'], ['LD D,d8', '2', '8'], ['RLA', '1', '4'], ['JR r8', '2', '12'], ['ADD HL,DE', '1', '8'], ['LD A,(DE)', '1', '8'], ['DEC DE', '1', '8'], ['INC E', '1', '4'], ['DEC E', '1', '4'], ['LD E,d8', '2', '8'], ['RRA', '1', '4'], ['JR NZ,r8', '2', '12/8'], ['LD HL,d16', '3', '12'], ['LD (HL+),A', '1', '8'], ['INC HL', '1', '8'], ['INC H', '1', '4'], ['DEC H', '1', '4'], ['LD H,d8', '2', '8'], ['DAA', '1', '4'], ['JR Z,r8', '2', '12/8'], ['ADD HL,HL', '1', '8'], ['LD A,(HL+)', '1', '8'], ['DEC HL', '1', '8'], ['INC L', '1', '4'], ['DEC L', '1', '4'], ['LD L,d8', '2', '8'], ['CPL', '1', '4'], ['JR NC,r8', '2', '12/8'], ['LD SP,d16', '3', '12'], ['LD (HL-),A', '1', '8'], ['INC SP', '1', '8'], ['INC (HL)', '1', '12'], ['DEC (HL)', '1', '12'], ['LD (HL),d8', '2', '12'], ['SCF', '1', '4'], ['JR C,r8', '2', '12/8'], ['ADD HL,SP', '1', '8'], ['LD A,(HL-)', '1', '8'], ['DEC SP', '1', '8'], ['INC A', '1', '4'], ['DEC A', '1', '4'], ['LD A,d8', '2', '8'], ['CCF', '1', '4'], ['LD B,B', '1', '4'], ['LD B,C', '1', '4'], ['LD B,D', '1', '4'], ['LD B,E', '1', '4'], ['LD B,H', '1', '4'], ['LD B,L', '1', '4'], ['LD B,(HL)', '1', '8'], ['LD B,A', '1', '4'], ['LD C,B', '1', '4'], ['LD C,C', '1', '4'], ['LD C,D', '1', '4'], ['LD C,E', '1', '4'], ['LD C,H', '1', '4'], ['LD C,L', '1', '4'], ['LD C,(HL)', '1', '8'], ['LD C,A', '1', '4'], ['LD D,B', '1', '4'], ['LD D,C', '1', '4'], ['LD D,D', '1', '4'], ['LD D,E', '1', '4'], ['LD D,H', '1', '4'], ['LD D,L', '1', '4'], ['LD D,(HL)', '1', '8'], ['LD D,A', '1', '4'], ['LD E,B', '1', '4'], ['LD E,C', '1', '4'], ['LD E,D', '1', '4'], ['LD E,E', '1', '4'], ['LD E,H', '1', '4'], ['LD E,L', '1', '4'], ['LD E,(HL)', '1', '8'], ['LD E,A', '1', '4'], ['LD H,B', '1', '4'], ['LD H,C', '1', '4'], ['LD H,D', '1', '4'], ['LD H,E', '1', '4'], ['LD H,H', '1', '4'], ['LD H,L', '1', '4'], ['LD H,(HL)', '1', '8'], ['LD H,A', '1', '4'], ['LD L,B', '1', '4'], ['LD L,C', '1', '4'], ['LD L,D', '1', '4'], ['LD L,E', '1', '4'], ['LD L,H', '1', '4'], ['LD L,L', '1', '4'], ['LD L,(HL)', '1', '8'], ['LD L,A', '1', '4'], ['LD (HL),B', '1', '8'], ['LD (HL),C', '1', '8'], ['LD (HL),D', '1', '8'], ['LD (HL),E', '1', '8'], ['LD (HL),H', '1', '8'], ['LD (HL),L', '1', '8'], ['HALT', '1', '4'], ['LD (HL),A', '1', '8'], ['LD A,B', '1', '4'], ['LD A,C', '1', '4'], ['LD A,D', '1', '4'], ['LD A,E', '1', '4'], ['LD A,H', '1', '4'], ['LD A,L', '1', '4'], ['LD A,(HL)', '1', '8'], ['LD A,A', '1', '4'], ['ADD A,B', '1', '4'], ['ADD A,C', '1', '4'], ['ADD A,D', '1', '4'], ['ADD A,E', '1', '4'], ['ADD A,H', '1', '4'], ['ADD A,L', '1', '4'], ['ADD A,(HL)', '1', '8'], ['ADD A,A', '1', '4'], ['ADC A,B', '1', '4'], ['ADC A,C', '1', '4'], ['ADC A,D', '1', '4'], ['ADC A,E', '1', '4'], ['ADC A,H', '1', '4'], ['ADC A,L', '1', '4'], ['ADC A,(HL)', '1', '8'], ['ADC A,A', '1', '4'], ['SUB B', '1', '4'], ['SUB C', '1', '4'], ['SUB D', '1', '4'], ['SUB E', '1', '4'], ['SUB H', '1', '4'], ['SUB L', '1', '4'], ['SUB (HL)', '1', '8'], ['SUB A', '1', '4'], ['SBC A,B', '1', '4'], ['SBC A,C', '1', '4'], ['SBC A,D', '1', '4'], ['SBC A,E', '1', '4'], ['SBC A,H', '1', '4'], ['SBC A,L', '1', '4'], ['SBC A,(HL)', '1', '8'], ['SBC A,A', '1', '4'], ['AND B', '1', '4'], ['AND C', '1', '4'], ['AND D', '1', '4'], ['AND E', '1', '4'], ['AND H', '1', '4'], ['AND L', '1', '4'], ['AND (HL)', '1', '8'], ['AND A', '1', '4'], ['XOR B', '1', '4'], ['XOR C', '1', '4'], ['XOR D', '1', '4'], ['XOR E', '1', '4'], ['XOR H', '1', '4'], ['XOR L', '1', '4'], ['XOR (HL)', '1', '8'], ['XOR A', '1', '4'], ['OR B', '1', '4'], ['OR C', '1', '4'], ['OR D', '1', '4'], ['OR E', '1', '4'], ['OR H', '1', '4'], ['OR L', '1', '4'], ['OR (HL)', '1', '8'], ['OR A', '1', '4'], ['CP B', '1', '4'], ['CP C', '1', '4'], ['CP D', '1', '4'], ['CP E', '1', '4'], ['CP H', '1', '4'], ['CP L', '1', '4'], ['CP (HL)', '1', '8'], ['CP A', '1', '4'], ['RET NZ', '1', '20/8'], ['POP BC', '1', '12'], ['JP NZ,a16', '3', '16/12'], ['JP a16', '3', '16'], ['CALL NZ,a16', '3', '24/12'], ['PUSH BC', '1', '16'], ['ADD A,d8', '2', '8'], ['RST 00H', '1', '16'], ['RET Z', '1', '20/8'], ['RET', '1', '16'], ['JP Z,a16', '3', '16/12'], ['PREFIX CB', '1', '4'], ['CALL Z,a16', '3', '24/12'], ['CALL a16', '3', '24'], ['ADC A,d8', '2', '8'], ['RST 08H', '1', '16'], ['RET NC', '1', '20/8'], ['POP DE', '1', '12'], ['JP NC,a16', '3', '16/12'], null, ['CALL NC,a16', '3', '24/12'], ['PUSH DE', '1', '16'], ['SUB d8', '2', '8'], ['RST 10H', '1', '16'], ['RET C', '1', '20/8'], ['RETI', '1', '16'], ['JP C,a16', '3', '16/12'], null, ['CALL C,a16', '3', '24/12'], null, ['SBC A,d8', '2', '8'], ['RST 18H', '1', '16'], ['LDH (a8),A', '2', '12'], ['POP HL', '1', '12'], ['LD (C),A', '2', '8'], null, null, ['PUSH HL', '1', '16'], ['AND d8', '2', '8'], ['RST 20H', '1', '16'], ['ADD SP,r8', '2', '16'], ['JP (HL)', '1', '4'], ['LD (a16),A', '3', '16'], null, null, null, ['XOR d8', '2', '8'], ['RST 28H', '1', '16'], ['LDH A,(a8)', '2', '12'], ['POP AF', '1', '12'], ['LD A,(C)', '2', '8'], ['DI', '1', '4'], null, ['PUSH AF', '1', '16'], ['OR d8', '2', '8'], ['RST 30H', '1', '16'], ['LD HL,SP+r8', '2', '12'], ['LD SP,HL', '1', '8'], ['LD A,(a16)', '3', '16'], ['EI', '1', '4'], null, null, ['CP d8', '2', '8'], ['RST 38H', '1', '16']],
  
  instructions: new Array(0x100),
  
  /**
    * Methods
    */
    
  read: function(address) { return this.memory[address]; },

  write: function(address, value) { this.memory[address] = value; },

  push: function(value) {

    write(registers.SP + 0x100, value);
    registers.SP = Utils.wrap8(this.SP - 1);
  },

  pop: function() {

    this.SP = Utils.wrap8(this.SP + 1);
    return read(this.SP + 0x100);
  },

  init: function() {

    this.instructions = X.InstructionImplementations.generate(this);
  },
  
  reset: function() {
  
    // Copy bios into memory
    this.memory.splice.apply(this.memory, [0, 0xFF].concat(this.bios));
  },
  
  step: function() {

    // Fetch
    
    var opcode = this.memory[this.PC];
    
    var instruction = this.instructions[opcode];
    var bytes = this.opcodes[opcode][1];
    var cycles = this.opcodes[opcode][2];
    //console.log(opcode, instruction, bytes, cycles);
    var operands = this.memory.slice(this.PC + 1, this.PC + bytes);
    //console.log(operands);
    // Execute
    
    this.PC = X.Utils.wrap16(this.PC + bytes);
    instruction(operands);
    
    // Check for interrupts
    
    // ...
    
    return cycles;
  }
};


/**
  *
  * Instruction implementations
  *
  */
  
X.InstructionImplementations = {

  generate: function(cpu) {

    var instructions = [];

    for (var opcode in cpu.opcodes) {
      var specs = cpu.opcodes[opcode];
      if (specs != null) {
        instructions[opcode] = this.generate_instruction(cpu, specs, opcode);
        //console.log(instructions[opcode]);
      }
    };

    return instructions;
  },
  
  generate_instruction: function(cpu, specs, opcode) {

    var parts = specs[0].split(' ');
    
    var instruction_name = parts[0];
    //console.log(specs,instruction_name);
    if (parts.length > 1) {
      
      var parameter_names = parts[1].split(',');
      
      var parameters = [];
      for (var i in parameter_names) {
        parameters.push(this.generate_parameter(cpu, parameter_names[i]));
      }
    }    
    
    return this[instruction_name](cpu, parameters);
  },

  generate_parameter: function(cpu, parameter_name) {
    //console.log(parameter_name);
    
    // Special cases first
    if (parameter_name == '0') { // STOP
      return null;
    }
    else if (parameter_name.match(/^[0-3][0|8]H$/)) { // RST
      return null; // TODO
    }
    else if (parameter_name == 'SP+r8') { // LD
      return null; // TODO
    }
    
    core = parameter_name.match(/^\(?([A-Z]+|a8|d8|r8|a16|d16)[\+|\-]?\)?$/)[1];
    //console.log('core',core);
    
    // Common cases
    
    var f = null;
    
    if (core.match(/^[A-Z]+$/)) { // Register
      //console.log('register', X.CPU[core]);
      f = {
        get: function(operands) { return cpu[parameter_name]; },
        set: function(operands, value) { cpu[parameter_name] = value; }
      };
    }
    else if (core.match(/^d8|a8|r8$/)) { // Immediate value
      //console.log('immediate8', core);
      f = {
        get: function(operands) { return operands[0]; },
      };
    }
    else if (core.match(/^d16|a16$/)) { // Immediate value
      //console.log('immediate16', core);
      f = {
        get: function(operands) { return X.Utils.hilo(operands[1], operands[0]); },
      };
    }
    else {
      //console.log('unknown', core);
      f = null;
    }
    
    // If the parameter is between parentheses, add a layer of indirection
    
    if (parameter_name[0] == '(') {
      return {
        get: function(operands) { return cpu.memory[f.get(operands)]; },
        set: function(operands, value) { cpu.memory[f.get(operands)] = value; }
      };
    }
    else {
      return f;
    }
  },
  
  /**
    * Implementations
    */
  
  'ADC': function(cpu, parameters) {
    return function(operands) {
      parameters[0].set(parameters[0].get(operands) + parameters[1].get(operands) + cpu.get_flag(cpu.Flags.CARRY)); // TODO wrap???
    };
  },
  
  'ADD': function(cpu, parameters) {
    return function(operands) {
      parameters[0].set(parameters[0].get(operands) + parameters[1].get(operands)); // TODO wrap???
    };
  },
  
  'AND': function(cpu, parameters) {
    return function(operands) {
      X.CPU.registers.A &= parameters[0].get(operands);
    };
  },
  
  'CALL': function(cpu, parameters) {
    return function(operands) {
      // Nothing
    };
  },
  
  'CCF': function(cpu, parameters) {
    return function(operands) {
      var flag = cpu.Flags.CARRY;
      cpu.set_flag(flag, !cpu.get_flag(flag));
    };
  },
  
  'CP': function(cpu, parameters) {
    return function(operands) {
      var A = cpu.A; // TODO
    };
  },
  
  'CPL': function(cpu, parameters) {
    return function(operands) {
      cpu.A = ~cpu.A;
    };
  },
  
  'DAA': function(cpu, parameters) {
    return function(operands) {
      // Nothing
    };
  },
  
  'DEC': function(cpu, parameters) {
    return function(operands) {
      parameters[0].set(operands, parameters[0].get(operands) - 1); // TODO wrap???
    };
  },
  
  'DI': function(cpu, parameters) {
    return function(operands) {
      // Disable interrupts
    };
  },
  
  'EI': function(cpu, parameters) {
    return function(operands) {
      // Enable interrupts
    };
  },
  
  'HALT': function(cpu, parameters) {
    return function(operands) {
      // Nothing
    };
  },
  
  'INC': function(cpu, parameters) {
    return function(operands) {
      parameters[0].set(operands, parameters[0].get(operands) + 1); // TODO wrap???
    };
  },
  
  'JP': function(cpu, parameters) {
    return function(operands) {
      // Nothing
    };
  },
  
  'JR': function(cpu, parameters) {
    return function(operands) {
      // Nothing
    };
  },
  
  'LD': function(cpu, parameters) {
    return function(operands) {
      parameters[0].set(operands, parameters[1].get(operands));
    };
  },
  
  'LDH': function(cpu, parameters) {
    return function(operands) {
      // Nothing
    };
  },
  
  'NOP': function(cpu, parameters) {
    return function(operands) {
      // Nothing
    };
  },
  
  'OR': function(cpu, parameters) {
    return function(operands) {
      cpu.A |= parameters[0].get(operands);
    };
  },
  
  'POP': function(cpu, parameters) {
    return function(operands) {
      // Nothing
    };
  },
  
  'PUSH': function(cpu, parameters) {
    return function(operands) {
      // Nothing
    };
  },
  
  'RET': function(cpu, parameters) {
    return function(operands) {
      // Nothing
    };
  },
  
  'RETI': function(cpu, parameters) {
    return function(operands) {
      // Nothing
    };
  },
  
  'RLA': function(cpu, parameters) {
    return function(operands) {
      var bit7 = Utils.nth_bit(X.CPU.registers.A, 7);
      cpu.A = cpu.A << 1;
      bit0 = bit7;
      CARRY = bit7;
    };
  },
  
  'RLCA': function(cpu, parameters) {
    return function(operands) {
      // same as RLA?
    };
  },
  
  'RRA': function(cpu, parameters) {
    return function(operands) {
      // Nothing
    };
  },
  
  'RRCA': function(cpu, parameters) {
    return function(operands) {
      // Nothing
    };
  },
  
  'RST': function(cpu, parameters) {
    return function(operands) {
      // Nothing
    };
  },
  
  'SBC': function(cpu, parameters) {
    return function(operands) {
      parameters[0].set(operands, parameters[0].get(operands) - parameters[1].get(operands) - CARRY); // TODO wrap???
    };
  },
  
  'SCF': function(cpu, parameters) {
    return function(operands) {
      cpu.set_flag(cpu.Flags.CARRY, true);
    };
  },
  
  'STOP': function(cpu, parameters) {
    return function(operands) {
      // Nothing
    };
  },
  
  'SUB': function(cpu, parameters) {
    return function(operands) {
      cpu.A = cpu.A - parameters[0].get(operands); // TODO wrap???
    };
  },
  
  'SWAP': function(cpu, parameters) {
    return function(operands) {
      // TODO
    };
  },
  
  'XOR': function(cpu, parameters) {
    return function(operands) {
      cpu.A ^= parameters[0].get(operands);
    };
  },
  
  'PREFIX': function(cpu, parameters) { // BUGBUGBUG
    return function(operands) {
      // Nothing
    };
  },
};


/*
var Instructions = {

	ADC: function(cpu, addressing_mode) {
		return function(operand) {
      var a = cpu.registers.a;
      var b = addressing_mode.get(operand);
			var value = a + b + cpu.get_flag(CPU.Flags.CARRY);
      cpu.registers.a = Utils.wrap8(value);
      cpu.set_flag(CPU.Flags.CARRY, value > 0xFF);
			cpu.set_flag(CPU.Flags.ZERO, cpu.registers.a == 0);
			cpu.set_flag(CPU.Flags.OVERFLOW, Utils.sign(a) == Utils.sign(b) && Utils.sign(a) != Utils.sign(value));
			cpu.set_flag(CPU.Flags.NEGATIVE, Utils.is_negative(cpu.registers.a));
		}
	},
	
	AND: function(cpu, addressing_mode) {
		return function(operand) {
			cpu.registers.a &= addressing_mode.get(operand);
			cpu.set_flag(CPU.Flags.ZERO, cpu.registers.a == 0);
			cpu.set_flag(CPU.Flags.NEGATIVE, Utils.is_negative(cpu.registers.a));
		}
	},
	
	ASL: function(cpu, addressing_mode) {
		return function(operand) {
			var value = addressing_mode.get(operand);
			var bit7 = Utils.nth_bit(value, 7);
			value = Utils.wrap8(value << 1);
			addressing_mode.set(operand, val);
			cpu.set_flag(CPU.Flags.CARRY, !!bit7);
			cpu.set_flag(CPU.Flags.ZERO, cpu.registers.a == 0);
			cpu.set_flag(CPU.Flags.NEGATIVE, Utils.is_negative(value));
		}
	},
	
  B__: function(cpu, flag, state, addressing_mode) {
    return function(operand) {
      if(cpu.get_flag(flag) == state) {
        cpu.registers.PC = Utils.wrap16(addressing_mode.target(operand));
      }
    }
  },
	
	BIT: function(cpu, addressing_mode) {
		return function(operand) {
			var value = addressing_mode.get(operand) & cpu.registers.a;
			cpu.set_flag(CPU.Flags.ZERO, value == 0);
			cpu.set_flag(CPU.Flags.OVERFLOW, !!Utils.nth_bit(value, 6));
			cpu.set_flag(CPU.Flags.NEGATIVE, !!Utils.nth_bit(value, 7));
		}
	},
	
	BRK: function(cpu) {
		return function(operand) {
      cpu.push(cpu.registers.PC >> 8);
      cpu.push(cpu.registers.PC & 0xFF);
      cpu.push(cpu.registers.status);
      cpu.registers.PC = cpu.read(0xFFFE) | cpu.read(0xFFFF) << 8;
      --cpu.registers.PC; // why did I do that???
      cpu.set_flag(CPU.Flags.BREAK, true);
		}
	},
	
	CLC: function(cpu) {
		return function(operand) {
			cpu.set_flag(CPU.Flags.CARRY, false);
		}
	},
	
	CLD: function(cpu) {
		return function(operand) {
			cpu.set_flag(CPU.Flags.DECIMAL, false);
		}
	},
	
	CLI: function(cpu) {
		return function(operand) {
			cpu.set_flag(CPU.Flags.DISABLE_INTERRUPT, false);
		}
	},
	
	CLV: function(cpu) {
		return function(operand) {
			cpu.set_flag(CPU.Flags.OVERFLOW, false);
		}
	},
	
	CM: function(cpu, register, addressing_mode) {
		return function(operand) {
			var value = cpu.registers[register] - addressing_mode.get(operand);
			cpu.set_flag(CPU.Flags.CARRY, value >= 0);
			cpu.set_flag(CPU.Flags.ZERO, value == 0);
			cpu.set_flag(CPU.Flags.NEGATIVE, Utils.is_negative(value));
		}
	},
	
	DE_: function(cpu, register) {
		return function() {
			cpu.registers[register] = Utils.wrap8(cpu.registers[register] - 1);
			cpu.set_flag(CPU.Flags.ZERO, cpu.registers[register] == 0);
			cpu.set_flag(CPU.Flags.NEGATIVE, Utils.is_negative(cpu.registers[register]));
		}
	},
	
	DEC: function(cpu, addressing_mode) {
		return function(operand) {
			var value = addressing_mode.set(operand, Utils.wrap8(addressing_mode.get(operand)-1));
			cpu.set_flag(CPU.Flags.ZERO, value == 0);
			cpu.set_flag(CPU.Flags.NEGATIVE, Utils.is_negative(value));
		}
	},
	
	EOR: function(cpu, addressing_mode) {
		return function(operand) {
			cpu.registers.a ^= addressing_mode.get(operand);
      cpu.set_flag(CPU.Flags.ZERO, cpu.registers.a == 0);
			cpu.set_flag(CPU.Flags.NEGATIVE, Utils.is_negative(cpu.registers.a));
		}
	},

	IN_: function(cpu, register) {
		return function(operand) {
      cpu.registers[register] = Utils.wrap8(cpu.registers[register] + 1);
			cpu.set_flag(CPU.Flags.ZERO, cpu.registers[register] == 0);
			cpu.set_flag(CPU.Flags.NEGATIVE, Utils.is_negative(cpu.registers[register]));
		}
	},
	
	INC: function(cpu, addressing_mode) {
		return function(operand) {
			var value = addressing_mode.set(operand, Utils.wrap8(addressing_mode.get(operand) + 1));
			cpu.set_flag(CPU.Flags.ZERO, value == 0);
			cpu.set_flag(CPU.Flags.NEGATIVE, Utils.is_negative(value));
		}
	},
	
	JMP: function(cpu, addressing_mode) {
		return function(operand) {
			cpu.registers.PC = Utils.wrap16(addressing_mode.target(operand));
		}
	},
	
	JSR: function(cpu, addressing_mode) {
		return function(operand) {
      cpu.push(cpu.registers.PC >> 8);
      cpu.push(cpu.registers.PC & 0xFF);
      console.log(cpu.registers.PC.toString(16), '->', addressing_mode.target(operand).toString(16));
      cpu.registers.PC = addressing_mode.target(operand);
    }
	},
	
	LD_: function(cpu, register, addressing_mode) {
		return function(operand) {
			cpu.registers[register] = addressing_mode.get(operand);
			cpu.set_flag(CPU.Flags.ZERO, cpu.registers[register] == 0);
			cpu.set_flag(CPU.Flags.NEGATIVE, Utils.is_negative(cpu.registers[register]));
		}
	},
	
	LSR: function(cpu, addressing_mode, cycles, bytes) {
		return function(operand) {
			var value = addressing_mode.get(operand);
			var bit0 = Utils.nth_bit(value, 0);
			value = value >> 1;
			addressing_mode.set(operand, value);
			cpu.set_flag(CPU.Flags.CARRY, !!bit0);
			cpu.set_flag(CPU.Flags.ZERO, value == 0);
			cpu.set_flag(CPU.Flags.NEGATIVE, false);			
		}
	},
	
	NOP: function(cpu) {
		return function() {
			// ...
		}
	},
	
	ORA: function(cpu, addressing_mode) {
		return function(operand) {
			cpu.registers.a |= addressing_mode.get(operand);
			cpu.set_flag(CPU.Flags.ZERO, cpu.registers.a == 0);
			cpu.set_flag(CPU.Flags.ZERO, Utils.is_negative(cpu.registers.a));
		}
	},
	
	PH_: function(cpu, register) {
		return function(operand) {
			cpu.push(cpu.registers[register]);
		}
	},
	
	PLA: function(cpu) {
		return function(operand) {
			cpu.registers.a = cpu.pull();
			cpu.set_flag(CPU.Flags.ZERO, cpu.registers.a == 0);
			cpu.set_flag(CPU.Flags.NEGATIVE, Utils.is_negative(cpu.registers.a));	
		}
	},
	
	PLS: function(cpu) {
		return function(operand) {
			cpu.registers.status = cpu.pull();
		}
	},
	
	ROL: function(cpu, addressing_mode) {
		return function(operand) {
			var value = addressing_mode.get(operand);
			var bit7 = Utils.nth_bit(value, 7);
			value = (value << 1) & 0xFF;
			value += cpu.get_flag(CPU.Flags.CARRY) ? 1 : 0;
			addressing_mode.set(operand, value);
			cpu.set_flag(CPU.Flags.CARRY, !!bit7);
			cpu.set_flag(CPU.Flags.ZERO, cpu.registers.a == 0);
			cpu.set_flag(CPU.Flags.NEGATIVE, Utils.is_negative(value));
		}
	},
	
	ROR: function(cpu, addressing_mode) {
		return function(operand) {
			var value = addressing_mode.get(operand);
			var bit0 = Utils.nth_bit(value, 0);
			value = (value > 1) & 0xFF;
			value += cpu.get_flag(CPU.Flags.CARRY) ? 1 : 0;
			addressing_mode.set(operand, value);
			cpu.set_flag(CPU.Flags.CARRY, !!bit0);
			cpu.set_flag(CPU.Flags.ZERO, cpu.registers.a == 0);
			cpu.set_flag(CPU.Flags.NEGATIVE, Utils.is_negative(value));
		}
	},
	
	RTI: function(cpu) {
		return function(operand) {
			cpu.registers.status = cpu.pull();
      cpu.registers.PC = cpu.pull() | cpu.pull() << 8;
		}
	},
	
	RTS: function(cpu) {
		return function(operand) {
			cpu.registers.PC = (cpu.pull() | cpu.pull() << 8);
      console.log('RTS', cpu.registers.PC.toString(16));
		}
	},
	
	SBC: function(cpu, addressing_mode) {
		return function(operand) {
      var a = cpu.registers.a;
      var b = addressing_mode.get(operand);
      var value = a - b - !cpu.get_flag(CPU.Flags.CARRY);
      cpu.registers.a = Utils.wrap8(value);
      cpu.set_flag(CPU.Flags.CARRY, value < 0);
			cpu.set_flag(CPU.Flags.ZERO, cpu.registers.a == 0);
			cpu.set_flag(CPU.Flags.OVERFLOW, Utils.sign(a) != Utils.sign(b) && Utils.sign(a) != Utils.sign(value));
			cpu.set_flag(CPU.Flags.NEGATIVE, Utils.is_negative(cpu.registers.a));
    }
	},
      
	SEC: function(cpu) {
		return function() {
			cpu.set_flag(CPU.Flags.CARRY, true);
		}
	},
	
	SED: function(cpu) {
		return function(operand) {
			cpu.set_flag(CPU.Flags.DECIMAL, true);
		}
	},
	
	SEI: function(cpu) {
		return function(operand) {
			cpu.set_flag(CPU.Flags.DISABLE_INTERRUPT, true);
		}
	},
	
	ST_: function(cpu, register, addressing_mode) {
		return function(operand) {
			addressing_mode.set(operand, cpu.registers[register]);
		}
	},
	
	T__: function(cpu, register_source, register_destination, addressing_mode) {
		return function(operand) {
			cpu.registers[register_destination] = cpu.registers[register_source];
			cpu.set_flag(CPU.Flags.ZERO, cpu.registers[register_destination] == 0);
			cpu.set_flag(CPU.Flags.NEGATIVE, Utils.is_negative(cpu.registers[register_destination]));
		}
	}
	
};
*/