var X = X || {};

X.Debugger = (function() {

  'use strict'

  var registers = {};

  var flags = {};

  var memory_window = [];
  var memory_window_start = 0;
  var memory_window_rows = 5;
  var memory_window_headers = [];

  var breakpoints = [];

  var tiles_canvas;
  var background_canvas;

  var init_buttons = function() {

    var buttons = document.querySelectorAll('section#buttons button');
    buttons[0].addEventListener('click', function() { X.GB.pause(); });
    buttons[1].addEventListener('click', function() { X.GB.step(); });
    buttons[2].addEventListener('click', function() { X.GB.run(); });
  };

  var init_registers = function() {

    // Cache the slots containing the CPU registers states
    var rows = document.querySelectorAll('section#registers tr');
    _.each(rows, function(row) {
      var name = row.children[0].textContent;
      var slot = row.children[1];
      registers[name] = slot;
    });

    update_registers();
  };

  var update_registers = function() {

    _.each(registers, function(slot, register) {
      slot.textContent = X.Utils.hex16(X.CPU[register]);
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

    // Fill the table and cache cells
    var table = document.querySelector('section#memory table');
    for (var r = 0; r < memory_window_rows; ++r) {
      
      var row = table.insertRow();
      for (var c = 0; c < 17; ++c) {

        var cell = row.insertCell();
        if (c == 0)
          memory_window_headers.push(cell);
        else
          memory_window.push(cell);
      } 
    }

    var input = document.querySelector('section#memory input');
    var button = document.querySelector('section#memory button');
    button.addEventListener('click', function() {
      memory_window_start = Math.floor(parseInt(input.value, 16) / 16) * 16;
      update_memory();      
    });

    update_memory();
  };

  var update_memory = function() {

    _.each(memory_window_headers, function(h, index) {
      h.textContent = X.Utils.hex16(memory_window_start + index * 16);
    });
      
    _.each(memory_window, function(m, index) {
      var address = memory_window_start + index;
      m.textContent = X.Utils.hex8(X.Memory.r(address));
    });
  };

  var init_breakpoints = function() {

    var input = document.querySelector('section#breakpoints input');
    var button = document.querySelector('section#breakpoints button');

    button.addEventListener('click', function() {
      toggle_breakpoint(parseInt(input.value, 16));
    });

    toggle_breakpoint(0x3EE);
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
      list.removeChild(item);
    }
  };

  var init_tiles = function() {

    tiles_canvas = document.querySelector('section#debugger canvas#tiles').getContext('2d');
    update_tiles();
  };

  var update_tiles = function() {

    for (var y = 0; y < 24; ++y) {
      for (var x = 0; x < 16; ++x) {

        var tile = tiles_canvas.createImageData(8, 8);
        X.Utils.cache_to_image(X.PPU.cached_tiles[y*16 + x], tile.data);
        tiles_canvas.putImageData(tile, x*8, y*8);
      }
    }
  };

  var init_background = function() {

    background_canvas = document.querySelector('section#debugger canvas#background').getContext('2d');
    update_background();
  };

  var update_background = function(d) {

    for (var y = 0; y < 32; ++y)
      for (var x = 0; x < 32; ++x) {

        var tile_number = X.Memory.r(X.PPU.bg_tile_map + y*32 + x);
        var as = tile_number;
        tile_number = X.PPU.bg_window_tile_data == 0x8000 ? tile_number : 256 + X.Utils.signed(tile_number);
if (d) console.log(as.toString(16),tile_number.toString(16),X.PPU.bg_window_tile_data.toString(16),X.PPU.bg_tile_map.toString(16));
        var tile = background_canvas.createImageData(8, 8);
        X.Utils.cache_to_image(X.PPU.cached_tiles[tile_number], tile.data);
        background_canvas.putImageData(tile, x*8, y*8);
      }

    background_canvas.strokeStyle = 'rgb(255,0,0)';
    background_canvas.strokeRect(X.PPU.scroll_x, X.PPU.scroll_y, 160, 144);
  };

  return {

    init: function() {

      init_buttons();
      init_registers();
      init_flags();
      init_memory();
      init_breakpoints();
      init_tiles();
      init_background();
    },

    update: function(d) {

      update_registers();
      update_flags();
      update_memory();
      update_tiles();
      update_background(d);
    },

    logs: [],
    log: function() {

      if (false)// && X.CPU.PC > 0x100)
        console.log(Array.prototype.slice.call(arguments).join('       '));
      else {
        this.logs.push(Array.prototype.slice.call(arguments).join('       '));

        if (this.logs.length > 10) {
          this.logs = _.rest(this.logs);
        }
      }
    },

    log_instruction: function(opcode) {

      this.log(X.CPU.PC.toString(16));
      return;
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
