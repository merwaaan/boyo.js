var X = X || {};

/**
  *
  * Instruction implementations
  *
  */
  
X.InstructionImplementations = {

  /**
    *
    *
    *
    */
    
  generate: function(cpu) {

    var instructions = [];

    for (var o = 0; o < cpu.opcodes.length; ++o) {
      var specs = cpu.opcodes[o];
      if (specs != null) {
        instructions[o] = this.generate_instruction(cpu, specs, o);
      }
    };

    return instructions;
  },
  
  /**
    *
    *
    *
    */
    
  generate_instruction: function(cpu, specs, opcode) {

    var parts = specs[0].split(' ');
    
    var instruction_name = parts[0];
    
    if (parts.length > 1) {
      
      var parameter_names = parts[1].split(',');
      
      var parameters = [];
      for (var i in parameter_names) {
        parameters.push(this.generate_parameter(cpu, opcode, parameter_names[i]));
      }
    }
    
    return this[instruction_name](parameters);
  },

  /**
    *
    *
    *
    */
    
  generate_parameter: function(cpu, opcode, parameter_name) {
    
    // Special cases
    
    if (parameter_name.match(/^[0-3][0|8]H$/)) { // RST
      return {
        get: function(operands) { return parseInt(parameter_name, 16); }
      };
    }
    else if (parameter_name == 'SP+r8') { // Weird LD
      return null; // TODO
    }
    else if ([/*JR*/0x20, 0x28, 0x30, 0x38, /*RET*/0xC0, 0xC8, 0xD0, 0xD8].indexOf(opcode) > -1) { // Flag status condition
      var state = parameter_name[0] == 'N' ? false: true;
      var flag = parameter_name[parameter_name.length-1] == 'Z' ? 'zero' : 'carry';
      return {
        get: function(operands) { return cpu[flag] == state; }
      };
    }
    
    // Common cases
    
    var parameter = null;
    
    var core = parameter_name.match(/^\(?([A-Z]+|a8|d8|r8|a16|d16|[0-7])\)?$/)[1];
    
    if (core.match(/^[A-Z]+$/)) { // Register
      parameter = {
        get: function(operands) { return cpu[core]; },
        set: function(operands, value) { cpu[core] = value; }
      };
    }
    else if (core.match(/^d8|a8|r8$/)) { // Immediate 8-bit value
      parameter = {
        get: function(operands) { return operands[0]; },
      };
    }
    else if (core.match(/^d16|a16$/)) { // Immediate 16-bit value
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
      cpu.PC = X.Utils.hilo(parameters[0].get(operands));
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
  
  'LDH': function(parameters) {
    return function(cpu, operands) {
      // Nothing
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
  
  'PUSH': function(parameters) {
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
