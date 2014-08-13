var X = X || {};

X.Video = (function() {

  'use strict';

  var canvas;

  var background_maps;
  var tile_data;
  var oam;

  var vblank = function() {
  	X.CPU.request_interrupt(0);
  	return true;
  };

  return {

    // LCD control

    get LCDC() { return X.Memory.r(0xFF40); },
  	get display_enable() { return X.Utils.bit(this.LCDC, 7); },
  	get window_tile_map() { return X.Utils.bit(this.LCDC, 6) ? 0x9C00 : 0x9800; },
  	get window_enable() { return X.Utils.bit(this.LCDC, 5); },
  	get bg_window_tile_data() { return X.Utils.bit(this.LCDC, 4) ? 0x8000 : 0x8800; },
  	get bg_tile_map() { return X.Utils.bit(this.LCDC, 3) ? 0x9C00 : 0x9800; },
  	get obj_size() { return X.Utils.bit(this.LCDC, 2) ? 16 : 8; },
  	get obj_enable() { return X.Utils.bit(this.LCDC, 1); },
  	get bg_enable() { return X.Utils.bit(this.LCDC, 0); },

    // STAT

    get STAT() { return X.Memory.r(0xFF41); },
    get line_y_coincidence_interrupt() { return X.Utils.bit(this.STAT, 6); },
    get oam_interrupt() { return X.Utils.bit(this.STAT, 5); },
    get vblank_interrupt() { return X.Utils.bit(this.STAT, 4); },
    get hblank_interrupt() { return X.Utils.bit(this.STAT, 3); },
    get line_y_coincidence() { return X.Utils.bit(this.STAT, 2); }, set line_y_coincidence(x) { X.Memory.w(0xFF41, this.STAT & 0xFB | x) },
    get mode() { return this.STAT & 0x3; }, set mode(x) { X.Memory.w(0xFF41, this.STAT & 0x7C | x); },

    // Position and scrolling

  	get scroll_y() { return X.Memory.r(0xFF42); },
  	get scroll_x() { return X.Memory.r(0xFF43); },
  	get line_y() { return X.Memory.r(0xFF44); }, set line_y(x) { X.Memory.w(0xFF44, x); },
  	get line_y_compare() { return X.Memory.r(0xFF45); },
  	get window_x() { return X.Memory.r(0xFF4A); },
  	get window_y() { return X.Memory.r(0xFF4B); },

    // Palettes

  	get bg_palette() { return X.Memory.r(0xFF47); },
    get obj_palette_0() { return X.Memory.r(0xFF48); },
    get obj_palette_1() { return X.Memory.r(0xFF49); },

    /*colors: [
      [1, 1, 1, 1],
      [0.7, 0.7, 0.7, 1],
      [0.4, 0.4, 0.4, 1],
      [0, 0, 0, 1]
    ],*/
    colors: [
      [0xFF, 0xFF, 0xFF, 0xFF],
      [0xAA, 0xAA, 0xAA, 0xFF],
      [0x50, 0x50, 0x50, 0xFF],
      [0, 0, 0, 0xFF]
    ],

  	/**
  		* Memory mapping
  		*/

		r: function(address) {

			// Tile data
			if (address < 0x9800) {
				return tile_data[address - 0x8000];
			}

			// Background maps
			else if (address < 0xA000) {
				return background_maps[address - 0x9800];
			}

			// OAM
			else {
				return oam[address - 0xFE00];
			}
		},

		w: function(address, value) {

			// Tile data
			if (address < 0x9800) {
				tile_data[address - 0x8000] = value;
				this.update_cached_tile(address - 0x8000);
				return value
			}

			// Background maps
			else if (address < 0xA000) {
				return background_maps[address - 0x9800] = value;
			}

			// OAM
			else {
				return oam[address - 0xFE00] = value;
			}
		},

		dma_transfer: function(value) {

			var starting_address = value * 0x100;

			for (var i = 0; i < 160; ++i) {
				oam[i] = X.Memory.r(starting_address + i);
			}
		},

		/**
			* 
			*/

    cached_tiles: new Array(384),

    update_cached_tile: function(index) {

    	var tile_number = Math.floor(index / 16);
    	var memory_row = index - index % 2;
    	var image_row = Math.floor((index % 16) / 2);

    	for (var p = 0; p < 8; ++p) {

    		var a = X.Utils.bit(tile_data[memory_row], p);
        var b = X.Utils.bit(tile_data[memory_row + 1], p);
        var c = a | b << 1;
              
        this.cached_tiles[tile_number][image_row*8 + (7-p)] = c;
      }

    },

    init: function() {

      X.Renderer.init();

      canvas = document.querySelector('section#game canvas').getContext('2d');

			background_maps = new Array(2048);
		  tile_data = new Array(6144);
		  oam = new Array(160);

		  X.Utils.fill(background_maps);
		  X.Utils.fill(tile_data);
		  X.Utils.fill(oam);
      
      for (var t = 0, l = this.cached_tiles.length; t < l; ++t) {
      	var pixels = new Array(64);
      	X.Utils.fill(pixels);
      	this.cached_tiles[t] = pixels;
      }
    },

    reset: function() {

      X.Renderer.reset();

		  X.Utils.fill(background_maps);
		  X.Utils.fill(tile_data);
		  X.Utils.fill(oam);

    	this.mode = 2; // Really necessary??
    },

    line_x: 0,

    scan: function(cycles) {

      if (!this.display_enable)
        return;

      // Background
      if (this.bg_enable)
        X.Renderer.scan_background(this.line_y);

      // Window
      if (this.window_enable) {

      }

      // Objects
      if (this.obj_enable) {

      }
    },

    next_frame: function() {

      X.Renderer.draw_frame(canvas);

      this.line_y = 0x90; // XXX really necessary?
    },

    mode_cycles: 2,
    mode_durations: [204, 4560, 80, 172],

    change_mode: function(m) {

      this.mode_cycles -= this.mode_durations[this.mode];
      this.mode = m;
    },

    step: function(cycles) {

      this.mode_cycles += cycles;

      switch (this.mode) {

        case 0: // H-Blank
          if (this.mode_cycles > this.mode_durations[0]) {
          	if (this.line_y >= 144) {
	            this.change_mode(1);
	            this.next_frame();
      				return vblank();
	          }
          	else {
	            this.change_mode(2);
	            ++this.line_y;
              this.line_x = 0;

              // Check line coincidence
              if (this.line_y == this.line_y_compare) {
                //this.line_y_coincidence = true;
              }
	          }
	        }
          break;

        case 1: // V-Blank
          this.line_y = 145 + Math.floor(this.mode_cycles/456);
          if (this.mode_cycles > this.mode_durations[1]) {
            this.change_mode(2);  
            this.line_y = 0;
            this.line_x = 0;
          }
          break;

        case 2: // OAM access
          if (this.mode_cycles > this.mode_durations[2]) {
            this.change_mode(3);  
          }
          break;

        case 3: // OAM + VRAM access
          if (this.mode_cycles > this.mode_durations[3]) {
            this.scan();
            this.change_mode(0);
          }
          break;
      }
	  }
  	
  };
  
})();

X.Renderer = (function() {

  'use strict';

  var canvas;
  var buffer;

  // Cached palettes:

  var cached_palettes = {
    bg: [],
    obj_0: [],
    obj_1: []
  };

  return {

    init: function() {

      var canvas_dom = document.createElement('canvas');
      canvas_dom.width = 160;
      canvas_dom.height = 144;
      document.querySelector('section#game').appendChild(canvas_dom);

      canvas = canvas_dom.getContext('2d');

      buffer = canvas.createImageData(canvas_dom.width, canvas_dom.height);

      // Maintain cached palettes for faster access

      var palettes = ['bg', 'obj_0', 'obj_1'];
      
      _.each(palettes, function(palette, index) {
        X.Memory.watch(0xFF47 + index, function(prop, old_val, new_val) {
          for (var b = 0; b < 4; ++b) {
            var color = X.Video.colors[X.Utils.bit(new_val, b*2) | X.Utils.bit(new_val, b*2 + 1) << 1];
            cached_palettes[palette][b] = [color[0], color[1], color[2], color[3]];
          }
        });
      });
    },

    reset: function() {

    },

    scan_background: function(y) {

      var sy = (y + X.Video.scroll_y) % 256;
      var ty = Math.floor(sy/8);
      var py = sy % 8;

      for (var x = 0; x < 160; ++x) {
        
        var sx = (x + X.Video.scroll_x) % 256;
        var tx = Math.floor(sx/8);
        var px = sx % 8;

        // Fetch the tile

        var tile_number = X.Memory.r(X.Video.bg_tile_map + ty*32 + tx);
        var tile_index = X.Video.bg_window_tile_data == 0x8000 ? tile_number : 256 + X.Utils.signed(tile_number);

        var tile = X.Video.cached_tiles[tile_index];
        
        // Fetch the pixel color

        var color = cached_palettes.bg[tile[py*8 + px]];

        // Draw the pixel

        this.scan_pixel(x, y, color);
      }
    },

    scan_obj: function() {

      for (var o = 0; o < 40; ++o) {

        var address = 0xFE00 + o*4;
        var pos_y = X.Memory.r(address);
        var pos_x = X.Memory.r(address + 1);

        // Skip the object if it is off-screen
        if (pos_y == 0 || pos_y >= 160 || pos_x == 0 || pos_x >= 168)
          continue;

        pos_y -= 16;
        pos_x -= 8;

        var tile_number = X.Memory.r(address + 2);
        var tile = X.Video.cached_tiles[tile_number];

        var attributes = X.Memory.r(address + 3);
        var obj_above = X.Utils.bit(attributes, 7);
        var flip_y = X.Utils.bit(attributes, 6);
        var flip_x = X.Utils.bit(attributes, 5);
        var palette = X.Utils.bit(attributes, 4) ? cached_palettes.obj_1 : cached_palettes.obj_0;

        for (var y = 0; y < 8; ++y) {
          for (var x = 0; x < 8; ++x) {

            var color_index = tile[y*8 + x];
            if (color_index == 0)
              continue;

            this.scan_pixel(pos_x + x, pos_y + y, palette[color_index]);    
          }
        }
      }
    },

    scan_pixel: function(x, y, color) {

      var index = (y * 160 + x) * 4;
      buffer.data[index] = color[0];
      buffer.data[index + 1] = color[1];
      buffer.data[index + 2] = color[2];
      buffer.data[index + 3] = color[3];
    },

    draw_frame: function(destination_canvas) {

      this.scan_obj(); // TODO sync with scanlining
      canvas.putImageData(buffer, 0, 0);
      

      //this.draw_background(destination_canvas, true);
      //this.draw_obj(destination_canvas);
    },

    draw_background: function(destination_canvas, scrolling, wrapping) {

      var sx = scrolling ? X.Video.scroll_x : 0;
      var sy = scrolling ? X.Video.scroll_y : 0;

      destination_canvas.drawImage(canvas, sx, sy, 160, 144, 0, 0, 160, 144);
    },

    draw_obj: function(destination_canvas) {

      // TODO
    }

  };

})();
