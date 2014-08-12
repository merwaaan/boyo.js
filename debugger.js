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
  var oam = [];

  var init_buttons = function() {

    var buttons = document.querySelectorAll('section#buttons button');
    buttons[0].addEventListener('click', function() { X.GB.pause(); buttons[0].disabled = true; buttons[1].disabled = false; buttons[2].disabled = false; });
    buttons[1].addEventListener('click', function() { X.GB.step(); });
    buttons[2].addEventListener('click', function() { X.GB.run(); buttons[2].disabled = true; buttons[0].disabled = false;buttons[1].disabled = true;  }); 
 }; // TODO initial states

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
return; // TODO let renderer handle it
    var image = tiles_canvas.createImageData(8, 8);

    for (var y = 0; y < 24; ++y) {
      for (var x = 0; x < 16; ++x) {
        var tile = X.Video.cached_tiles[y*16 + x];
        X.Utils.cache_to_image(tile, X.Video.test_palette, image.data);
        tiles_canvas.putImageData(image, x*8, y*8);
      }
    }
  };

  var init_background = function() {

    background_canvas = document.querySelector('section#debugger canvas#background').getContext('2d');
    background_canvas.strokeStyle = '#FF0000';

    update_background();
  };

  var update_background = function() {

    background_canvas.clearRect(0, 0, 256, 256);

    // Draw background
    X.Renderer.draw_background(background_canvas);

    // Draw scrolling frame
    background_canvas.strokeRect(X.Video.scroll_x, X.Video.scroll_y, 160, 144);
  };

  var init_oam = function() {

    var table = document.querySelector('section#debugger section#video table');

    for (var r = 0; r < 8; ++r) {

      var row = table.insertRow();
      for (var c = 0; c < 5; ++c) {

        var cell = row.insertCell();

        var canvas = document.createElement('canvas');
        canvas.width = 8;
        canvas.height = 8;
        cell.appendChild(canvas);

        for (var e = 0; e < 4; ++e) {
          var element = document.createElement('span');
          cell.appendChild(element);
        }

        oam[r*5 + c] = cell.children;
      }
    }

    update_oam();
  };

  var update_oam = function() {

    _.each(oam, function(object, index) {

      var index = 0xFE00 + index*4;

      // Draw the corresponding tile
      var tile_number = X.Memory.r(index + 2);
      var tile = tiles_canvas.createImageData(8, 8);
      //X.Utils.cache_to_image(X.Video.cached_tiles[tile_number], X.Video.cached_obj_colors_0, tile.data);
      //object[0].getContext('2d').putImageData(tile, 0, 0);

      // Update the info
      object[1].textContent = X.Utils.hex8(X.Memory.r(index));
      object[2].textContent = X.Utils.hex8(X.Memory.r(index + 1));
      object[3].textContent = X.Utils.hex8(X.Memory.r(index + 2));
      object[4].textContent = X.Utils.hex8(X.Memory.r(index + 3));
    });
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
      init_oam();
    },

    reset: function() {

      // Remove breakpoints
      _.each(breakpoints, function(address) {
        toggle_breakpoint(address);
      });
    },

    update: function() {

      update_registers();
      update_flags();
      update_memory();
      update_tiles();
      update_background();
      update_oam();
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

      //this.log(X.CPU.PC.toString(16)); return;

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
