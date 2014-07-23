var X = X || {};

X.CPU = (function() {

  'use strict';

  var interrupts = [];

  return {

    /**
      * Registers
      */

    PC: 0,
    SP: 0,
    
    A: 0, F: 0, get AF() { return X.Utils.hilo(this.A, this.F); }, set AF(x) { this.A = X.Utils.hi(x); this.F = X.Utils.lo(x); },
    B: 0, C: 0, get BC() { return X.Utils.hilo(this.B, this.C); }, set BC(x) { this.B = X.Utils.hi(x); this.C = X.Utils.lo(x); },
    D: 0, E: 0, get DE() { return X.Utils.hilo(this.D, this.E); }, set DE(x) { this.D = X.Utils.hi(x); this.E = X.Utils.lo(x); },
    H: 0, L: 0, get HL() { return X.Utils.hilo(this.H, this.L); }, set HL(x) { this.H = X.Utils.hi(x); this.L = X.Utils.lo(x); },
    
    get_flag: function(mask) { return !!(this.F & mask); },
    set_flag: function(mask, set) { set ? this.F |= mask : this.F &= ~mask; },
   
    get carry() { return this.get_flag(1 << 4); }, set carry(x) { this.set_flag(1 << 4, x); },
    get halfcarry() { return this.get_flag(1 << 5); }, set halfcarry(x) { this.set_flag(1 << 5, x); },
    get addsub() { return this.get_flag(1 << 6); }, set addsub(x) { this.set_flag(1 << 6, x); },
    get zero() { return this.get_flag(1 << 7); }, set zero(x) { this.set_flag(1 << 7, x); },

    flag_names: ['zero', 'addsub', 'halfcarry', 'carry'],
    
    set flags(flags) {
      for (var i in this.flag_names)
        if (flags[i] !== undefined) this[this.flag_names[i]] = flags[i]
    },
    
    /**
      * Interrupts
      */

    interrupt_master_enable: true,
    get interrupt_enable() { return X.Memory.r(0xFFFF); },
    get interrupt_flag() { return X.Memory.r(0xFFFE); },

    handle_interrupts: function() {
      console.log('interrupt!');
    },

    /**
      * Instructions
      */

    instructions: [],
    
    /**
      * Methods
      */

    push: function(value) {
      X.Memory.w(--this.SP, value); // Wrap stack???
    },

    pop: function() {
      return X.Memory.r(this.SP++); // Wrap stack???
    },

    init: function() {

      //
      this.instructions = X.InstructionImplementations.generate();
    },

    step: function() {
      
      // Fetch

      var opcode = X.Memory.r(this.PC);
      opcode = opcode == 0xCB ? 0x100 + X.Memory.r(this.PC + 1) : opcode;  

      var instruction = this.instructions[opcode];
      var bytes = parseInt(X.InstructionImplementations.opcodes[opcode][1]); // later -> just store length and cycles as numbers
      var cycles = parseInt(X.InstructionImplementations.opcodes[opcode][2]);

      var operands = X.Memory.r_(this.PC + 1, bytes);

      // Execute
      
      X.Debugger.log_instruction(opcode);

      this.PC += bytes;
      instruction(operands);

      // Check for interrupts
      
      if (this.interrupt_master_enable && this.interrupt_requested & this.interrupt_enabled > 0) {
        this.handle_interrupts();
      }
      
      return cycles;
    }
  };

})();
