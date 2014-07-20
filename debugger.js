var X = X || {};

X.Debugger = (function() {

  'use strict'

  var registers = {};

  var memory_window = [];
  var memory_window_start = 0;

  var breakpoints = [];

  var init_buttons = function() {

    var buttons = document.querySelectorAll('section#buttons button');
    buttons[0].addEventListener('click', function() { X.GB.pause(); });
    buttons[1].addEventListener('click', function() { X.GB.step(); });
    buttons[2].addEventListener('click', function() { X.GB.run(); });
  };

  var init_registers = function() {

    // Cache the slots containing the CPU registers states
    var cells = document.querySelectorAll('section#registers td');
    _.each(cells, function(cell) {
      var name = cell.textContent;
      var slot = cell.children[0];
      registers[name] = slot;
    });
   
    // Watch the registers to update their slot
    _.each(registers, function(slot, register) {
      watch(X.CPU, register, function() {
        slot.textContent = X.Utils.hex8(X.CPU[register]);
      });
      callWatchers(X.CPU, register);
    });
  };

  var init_flags = function() {

    var checkboxes = document.querySelectorAll('section#flags input');
    _.each(checkboxes, function(checkbox) {
      checkbox.disabled = true;
      watch(X.CPU, checkbox.name, function(prop, action, new_value) {
        checkbox.checked = new_value;
      });
    });
  };

  var init_memory = function() {

    // Cache cells containing a window on the memory
    var rows = document.querySelector('section#memory table').querySelectorAll('tr');
    for (var r = 0; r < rows.length; ++r) {
      var address = rows[r].children[0];
      var value = rows[r].children[1];
      memory_window[r] = [address, value];
    }
    
    var input = document.querySelector('section#memory input');
    var button = document.querySelector('section#memory button');

    button.addEventListener('click', function() {

      // Remove previous watchers
      if (X.CPU.memory.watchers) {
        unwatch(X.CPU.memory);
      }

      memory_window_start = parseInt(input.value, 16);

      // Update the memory window
      for (var m = 0; m < memory_window.length; ++m) {
        var address = memory_window_start + m;
        memory_window[m][0].textContent = X.Utils.hex16(address);
        memory_window[m][1].textContent = X.Utils.hex16(X.CPU.memory[address]);

        // Watch the addresses visible in the window
        watch(X.CPU.memory, address, function(prop, action, new_value) {
          memory_window[prop - memory_window_start][1].textContent = X.Utils.hex16(X.CPU.memory[prop]);
        });
      }

    });

    button.click();
  };

  var init_breakpoints = function() {

    var input = document.querySelector('section#breakpoints input');
    var button = document.querySelector('section#breakpoints button');

    button.addEventListener('click', function() {
      toggle_breakpoint(parseInt(input.value, 16));
    });
  };

  var toggle_breakpoint = function(address) {

    var list = document.querySelector('section#breakpoints ul');

    var index = breakpoints.indexOf(address);
    
    // Add new breakpoint
    if (index < 0) {
      breakpoints.push(address);

      var item = document.createElement('li');
      item.textContent = X.Utils.hex16(address);
      list.appendChild(item);

      item.addEventListener('click', function() {
        toggle_breakpoint(address);
      });
    }

    // Remove existing breakpoint
    else {
      breakpoints.splice(index, 1);

      var item = _.find(list.children, function(child) { return parseInt(child.textContent, 16) === address });
      console.log(item);list.removeChild(item);
    }
  };

  return {

    init: function() {

      init_buttons();
      init_registers();
      init_flags();
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

      this.log(address.toString(16), instruction, instruction_name);
    },

    reached_breakpoint: function() {

      return _.contains(breakpoints, X.CPU.PC);
    }

  };

})();
