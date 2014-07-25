var X = X || {};

X.Debugger = (function() {

  'use strict'

  var registers = {};

  var flags = {};

  var memory_window = [];
  var memory_window_start = 0;

  var breakpoints = [];

  var init_buttons = function() {

    var buttons = document.querySelectorAll('section#buttons button');
    buttons[0].addEventListener('click', function() { X.GB.pause(); });
    buttons[1].addEventListener('click', function() { X.GB.step(true); });
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

    update_registers();
  };

  var update_registers = function() {

    _.each(registers, function(slot, register) {
      slot.textContent = X.Utils.hex8(X.CPU[register]);
    });
  };

  var init_flags = function() {

    // Cache the checkboxes representing flags
    var checkboxes = document.querySelectorAll('section#flags input');
    _.each(checkboxes, function(checkbox) {
      flags[checkbox.name] = checkbox;
      checkbox.disabled = true;
    });

    update_flags();
  };

  var update_flags = function() {

    _.each(flags, function(checkbox, flag) {
      checkbox.checked = X.CPU[flag];
    });
  };

  var init_memory = function() {

    // Cache cells containing a window on the memory
    var rows = document.querySelector('section#memory table').querySelectorAll('tr');
    _.each(rows, function(row) {
      var address_cell = row.children[0];
      var value_cell = row.children[1];
      memory_window.push([address_cell, value_cell]);
    });
    
    var input = document.querySelector('section#memory input');
    var button = document.querySelector('section#memory button');
    button.addEventListener('click', function() {
      memory_window_start = parseInt(input.value, 16);
      update_memory();      
    });

    update_memory();
  };

  var update_memory = function() {

    _.each(memory_window, function(m, index) {
      var address = memory_window_start + index;
      m[0].textContent = X.Utils.hex16(address);
      m[1].textContent = X.Utils.hex16(X.Memory.r(address));
    });
  };

  var init_breakpoints = function() {

    var input = document.querySelector('section#breakpoints input');
    var button = document.querySelector('section#breakpoints button');

    button.addEventListener('click', function() {
      toggle_breakpoint(parseInt(input.value, 16));
    });

    toggle_breakpoint(0x70);
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

    update: function() {

      update_registers();
      update_flags();
      update_memory();
    },

    logs: [],
    log: function() {

      if (false)
        console.log(Array.prototype.slice.call(arguments).join('       '));
      else {
        this.logs.push(Array.prototype.slice.call(arguments).join('       '));

        if (this.logs.length > 10) {
          this.logs = _.rest(this.logs);
        }
      }
    },

    log_instruction: function(opcode) {

      var address = X.CPU.PC;
      var bytes = parseInt(X.InstructionImplementations.opcodes[opcode][1]);
      var instruction = X.Memory.r_(address, bytes).map(function(x){ return x.toString(16) });
      var instruction_name = X.InstructionImplementations.opcodes[opcode][0];

      this.log(address.toString(16), instruction, instruction_name);
    },

    reached_breakpoint: function() {

      return _.contains(breakpoints, X.CPU.PC);
    }

  };

})();
