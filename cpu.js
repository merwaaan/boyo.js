var X = X || {};

X.CPU = (function() {

  'use strict';

  var DIV_accumulator = 0;
  var TIMA_accumulator = 0;
  var timer_clocks = [1024, 16, 64, 256]; //[4096, 262144, 65536, 16384];

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
    
    /**
      * Timer and divider
      */

    get DIV() { return X.Memory.r(0xFF04); }, set DIV(x) { X.Memory.w(0xFF04, x); },
    get TIMA() { return X.Memory.r(0xFF05); }, set TIMA(x) { X.Memory.w(0xFF05, x); },
    get TMA() { return X.Memory.r(0xFF06); }, set TMA(x) { X.Memory.w(0xFF06, x); },
    get TAC() { return X.Memory.r(0xFF07); }, set TAC(x) { X.Memory.w(0xFF07, x); },
    get timer_enable() { return X.Utils.bit(this.TAC, 2); },
    get timer_clock() { return this.TAC & 0x3; },

    update_timers: function(cycles) {

      DIV_accumulator += cycles;
      if (DIV_accumulator > 0xFF) {
        this.DIV = X.Utils.wrap8(this.DIV + 1);
        DIV_accumulator -= 0xFF;
      }

      if (this.timer_enable) {
        TIMA_accumulator += cycles;
        if (TIMA_accumulator >= timer_clocks[this.timer_clock]) {
          this.TIMA += 1;
          TIMA_accumulator -= timer_clocks[this.timer_clock];
          if (this.TIMA > 0xFF) {
            this.request_interrupt(2);
            this.TIMA = this.TMA;
          }
        }
      }
    },

    /**
      * Interrupts
      */

    halted: false,
    stopped: false,

    interrupt_master_enable: true,
    get interrupt_enable() { return X.Memory.r(0xFFFF); },
    get interrupt_request() { return X.Memory.r(0xFF0F); }, set interrupt_request(x) { X.Memory.w(0xFF0F, x); },

    request_interrupt: function(bit) {
      this.interrupt_request |= 1 << bit;
    },

    check_interrupts: function() {

      var interrupts = this.interrupt_request & this.interrupt_enable;
      if (interrupts == 0)
        return;

      // Interrupts terminate HALT
      this.halted = false; // TODO ime effect?? (prog manual p22)
      
      // Execute interrupts if enabled
      if (this.interrupt_master_enable)
        for (var b = 0; b < 5; ++b)
          if (X.Utils.bit(interrupts, b)) // TODO suspend others
            this.do_interrupt(b);
    },

    do_interrupt: function(bit) {

      // Disable interrupts
      this.interrupt_master_enable = false;
      this.interrupt_request &= ~(1 << bit);

      // Jump to the address of the interrupt procedure
      this.call(0x40 + 8*bit);
    },

    /**
      * Instructions
      */

    instructions: [],
    
    /**
      * Methods
      */

    push: function(value) {
      this.SP = X.Utils.wrap16(this.SP - 1);
      X.Memory.w(this.SP, value);
    },

    pop: function() {
      var value = X.Memory.r(this.SP);
      this.SP = X.Utils.wrap16(this.SP + 1);
      return value;
    },

    jump: function(address) {
      this.PC = address;
    },

    call: function(address) {
      this.push(X.Utils.hi(X.CPU.PC));
      this.push(X.Utils.lo(X.CPU.PC));
      this.jump(address);
    },

    ret: function() {
      var lo = X.CPU.pop();
      var hi = X.CPU.pop();
      this.jump(X.Utils.hilo(hi, lo));
    },

    init: function() {

      // Generate the instruction set
      this.instructions = X.InstructionSet.generate();
    },

    reset: function() {

      this.PC = 0; // TODO propose choice
      this.halted = false;
      this.stopped = false;
    },

    step: function() {
      
      var cycles = 1; // TODO check cycles on HALT/STOP
      // TODO handle timer & PPU without CPU

      if (!this.halted && !this.stopped) {
      
        // Fetch
        
        var opcode = X.Memory.r(this.PC);
        
        var cb_prefix = opcode == 0xCB;
        if (cb_prefix)
          opcode = 0x100 + X.Memory.r(this.PC + 1);

        var instruction = this.instructions[opcode];
        var bytes = instruction.bytes;
        var operands = X.Memory.r_(this.PC + (cb_prefix ? 2 : 1), bytes - (cb_prefix ? 2 : 1));

        // Execute

        cycles = instruction.execute(operands);

        //X.Debugger.log_instruction(opcode);
      }

      // Update timers
      this.update_timers(cycles); // TODO should not update on STOP??

      // Check for interrupts
      this.check_interrupts();

      return cycles;
    },

  };

})();
