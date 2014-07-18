var X = X || {};

X.Debugger = (function() {

  'use strict'

  var registers = {};
  var memory = {};
  var breakpoints = [];

  var init_buttons = function() {

    var buttons = document.querySelectorAll('button');
    buttons[0].addEventListener('click', function() { X.GB.pause(); });
    buttons[1].addEventListener('click', function() { X.GB.step(); });
    buttons[2].addEventListener('click', function() { X.GB.run(); });
  };

  var init_registers = function() {

    // Cache cells containing the CPU registers states
    var rows = document.querySelector('table#registers').querySelectorAll('tr');
    for (var r = 0; r < rows.length; ++r) {
      var row = rows[r];
      registers[row.children[0].textContent] = row.children[1];
    }
    
    // Watch the registers to update their cell
    for (var r in registers) {
      watch(X.CPU, r, function(prop, action, new_value) {
        registers[prop].textContent = X.Utils.hex16(new_value ? new_value : 0);
      });

      callWatchers(X.CPU, r);
    }
  };

  var init_memory = function() {

    var address = document.querySelector('input[name="address"]');
    var button = document.querySelector('button[name="go_to_address"]');

    button.addEventListener('click', function() {

      // Remove previous watchers
      for (var a in memory) {
        unwatch(X.CPU.memory, a);
      }

      var a = parseInt(address.value, 16);

      // Cache cells containing a window on the memory
      memory = {};
      var rows = document.querySelector('table#memory').querySelectorAll('tr');
      for (var r = 0; r < rows.length; ++r) {
        memory[a+r] = [rows[r].children[1], rows[r].children[2]];
      }

      // Update the memory window
      for (var m in memory) {
        m = parseInt(m);
        memory[m][0].textContent = X.Utils.hex16(a+m);
        memory[m][1].textContent = X.Utils.hex16(X.CPU.memory[a+m]);
      }

      // Watch the memory window
      var ad = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function(i){ return a + i });

      watch(X.CPU.memory, ad, function(prop, action, new_value) {
        memory[prop][1].textContent = X.Utils.hex16(X.CPU.memory[prop]);
      });

    }.bind(this));

    button.click();
  };

  var init_breakpoints = function() {

    var checkboxes = document.querySelectorAll('table#memory input[type="checkbox"]');
    for (var c = 0;  c < checkboxes.length; ++c) {
      checkboxes[c].addEventListener('change', function(c) { return function() {
        breakpoints.push(c);
      }}(c));
    }
  };

  return {

    init: function() {

      init_buttons();
      init_registers();
      init_memory();
      init_breakpoints();  
    },

    log: function() {
      console.log(Array.prototype.slice.call(arguments).join('       '));
    },

    log_instruction: function(opcode) {

      var address = X.CPU.PC;
      var bytes = parseInt(X.InstructionImplementations.opcodes[opcode][1]);
      var instruction = X.CPU.memory.slice(address, address + bytes).map(function(x){ return x.toString(16) });
      var instruction_name = X.InstructionImplementations.opcodes[opcode][0];
      var flags = [X.CPU.zero, X.CPU.addsub, X.CPU.halfcarry, X.CPU.carry];

      this.log(address.toString(16), instruction, instruction_name, flags);
    },

    reached_breakpoint: function() {

      return _.contains(breakpoints, X.CPU.PC);
    }

  };

})();
