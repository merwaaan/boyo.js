var X = X || {};

X.PPU = (function() {

  'use strict';

  var canvas;
  var canvas_ctx;

  var colors = [
    [0xFF, 0xFF, 0xFF],
   	[0xAA, 0xAA, 0xAA],
    [0x66, 0x66, 0x66],
    [0x00, 0x00, 0x00]
  ];

  var vblank = function() {
  	X.CPU.request_interrupt(0);
  	return true;
  };

  return {

    // LCL control

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
    get line_y_coincidence_flag() { return true; }, // TODO
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
  	
  	cached_bg_palette: [0, 1, 2, 3],
  	cached_obj_palette_0: [0, 1, 2, 3],
  	cached_obj_palette_1: [0, 1, 2, 3],

    // DMA transfer

    sprite: {
      position: [],
      number: 0
    },

    cached_tiles: [],

    init: function() {

      canvas = document.querySelector('section#game canvas');
      canvas_ctx = canvas.getContext('2d');

      // Maintain cached tiles for faster access

      for (var t = 0; t < 384; ++t) { // For each tile...

        var tile = new Array(64);
        X.Utils.fill(tile);
        this.cached_tiles.push(tile);

        for (var r = 0; r < 16; ++r) { // For each row...

          X.Memory.watch(0x8000 + t*16 + r, function(ppu, t, r) {
            return function(prop, old_val, new_val) {

              if (prop % 2 == 0) {
                var l1 = new_val;
                var l2 = X.Memory.r(prop + 1);
              }
              else {
                var l1 = X.Memory.r(prop - 1);
                var l2 = new_val;
              }

              for (var p = 0; p < 8; ++p) {
                var a = X.Utils.bit(l1, p);
                var b = X.Utils.bit(l2, p);
                var c = a | b << 1;
              
                ppu.cached_tiles[t][Math.floor(r/2)*8 + (7-p)] = c;
              }
            }
          }(this, t, r));
        }
      }

      // Maintain cached palettes for faster access

      var palettes = [this.cached_bg_palette, this.cached_obj_palette_0, this.cached_obj_palette_1];
      
      _.each(palettes, function(palette, index) {
      	X.Memory.watch(0xFF47 + index, function(prop, old_val, new_val) {
	      	for (var b = 0; b < 4; ++b)
						palette[b] = colors[X.Utils.bit(new_val, b*2) | X.Utils.bit(new_val, b*2 + 1) << 1];
    		}.bind(this));
      }); 

      //

      this.mode = 2;
    },

    draw_frame: function() {

    	canvas_ctx.clearRect(0, 0, 160, 144);

      var x0 = Math.floor(this.scroll_x / 32);
      var y0 = Math.floor(this.scroll_y / 32);

      for (var dy = 0; dy < 18; ++dy)
        for (var dx = 0; dx < 20; ++dx) {

          var tx = x0 + dx;
          var ty = y0 + dy;
          
          var tile_number = X.Memory.r(this.bg_tile_map + ty*32 + tx);
          tile_number = this.bg_window_tile_data == 0x8000 ? tile_number : 256 + X.Utils.signed(tile_number);
          
          var tile = canvas_ctx.createImageData(8, 8);
          X.Utils.cache_to_image(this.cached_tiles[tile_number], tile.data);
          canvas_ctx.putImageData(tile, dx*8, dy*8);
        }

      this.line_y = 0x90;
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
	            //this.draw_frame();
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
    }
  	
  };
  
})();
