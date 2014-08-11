var X = X || {};

X.Video = (function() {

  'use strict';

  var canvas;

  var colors = [
    [0xFF, 0xFF, 0xFF],
   	[0xAA, 0xAA, 0xAA],
    [0x66, 0x66, 0x66],
    [0x00, 0x00, 0x00]
  ];

	var colors____ = [
    '#FFFFFF',
   	'#AAAAAA',
    '#666666',
    '#000000'
  ];

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
  	
  	cached_bg_colors: [0, 1, 2, 3],
  	cached_obj_colors_0: [0, 1, 2, 3],
  	cached_obj_colors_1: [0, 1, 2, 3],

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

			background_maps = new Array(2048);
		  tile_data = new Array(6144);
		  oam = new Array(160);

		  X.Utils.fill(background_maps);
		  X.Utils.fill(tile_data);
		  X.Utils.fill(oam);

    	canvas = document.querySelector('section#game canvas').getContext('2d');

      for (var t = 0, l = this.cached_tiles.length; t < l; ++t) {
      	var pixels = new Array(64);
      	X.Utils.fill(pixels);
      	this.cached_tiles[t] = pixels;
      }

      // Maintain cached palettes for faster access

      var palettes = [this.cached_bg_colors, this.cached_obj_colors_0, this.cached_obj_colors_1];
      
      _.each(palettes, function(palette, index) {
      	X.Memory.watch(0xFF47 + index, function(prop, old_val, new_val) {
	      	for (var b = 0; b < 4; ++b)
						palette[b] = colors[X.Utils.bit(new_val, b*2) | X.Utils.bit(new_val, b*2 + 1) << 1];
    		});
      });
    },

    reset: function() {

		  X.Utils.fill(background_maps);
		  X.Utils.fill(tile_data);
		  X.Utils.fill(oam);

    	this.mode = 2; // Really necessary??
    },

    draw_frame: function() {

    	if (!this.display_enable)
    		return;

    	// Background

    	if (this.bg_enable) {

	    	canvas.clearRect(0, 0, 160, 144);

	      var x0 = Math.floor(this.scroll_x / 8);
	      var y0 = Math.floor(this.scroll_y / 8);

				var ox = this.scroll_x % 8;
	      var oy = this.scroll_y % 8;
	          
				for (var dy = 0; dy <= 18; ++dy)
	        for (var dx = 0; dx <= 20; ++dx) {

	          var tx = x0 + dx;
	          var ty = y0 + dy;

	          var tile_number = X.Memory.r(this.bg_tile_map + ty*32 + tx);
	          tile_number = this.bg_window_tile_data == 0x8000 ? tile_number : 256 + X.Utils.signed(tile_number);
	          
	          var tile = canvas.createImageData(8, 8);
		        X.Utils.cache_to_image(this.cached_tiles[tile_number], tile.data);
		        canvas.putImageData(tile, dx*8-ox, dy*8-oy);
	        }
			}

      // Objects

      if (this.obj_enable) {
      
	      for (var o = 0; o < 40; ++o) {

	      	var index = o*4;
	      	var pos_y = oam[index];
	      	var pos_x = oam[index + 1];

	      	// Skip the object if hidden off-screen
	      	if (pos_y == 0 || pos_y >= 160 || pos_x == 0 || pos_x >= 168)
	      		continue;

	      	pos_y -= 16;
	      	pos_x -= 8;

	      	var tile_number = oam[index + 2];
	      	var attributes = oam[index + 3];

					var tile = canvas.createImageData(8, 8);
	        X.Utils.cache_to_image(this.cached_tiles[tile_number], tile.data);
	        canvas.putImageData(tile, pos_x, pos_y);
	      }
			}

      // TODO different palettes
      // TODO flip
      // TODO depth priority
      // TODO window
      // TODO bg wrapping

      this.line_y = 0x90; // TODO really necessary?
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
	            this.draw_frame();
      				return vblank();
	          }
          	else {
	            this.change_mode(2);
	            ++this.line_y;  
	          }
	        }
          break;

        case 1: // V-Blank
          this.line_y = 145 + Math.floor(this.mode_cycles/456);
          if (this.mode_cycles > this.mode_durations[1]) {
            this.change_mode(2);  
            this.line_y = 0;
          }
          break;

        case 2: // OAM access
          if (this.mode_cycles > this.mode_durations[2]) {
            this.change_mode(3);  
          }
          break;

        case 3: // OAM + VRAM access
          if (this.mode_cycles > this.mode_durations[3]) {
            this.change_mode(0);
          }
          break;
      }

	    // Check line coincidence TODO move on line start
	    if (this.line_y == this.line_y_compare) {
	    	//this.line_y_coincidence = true;
	    }
	  }
  	
  };
  
})();
