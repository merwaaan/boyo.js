var X = X || {};

X.PPU = (function(globals) {

  'use strict';

  var canvas;
  var canvas_ctx;

  var colors = [
    'white',
    'lightgray',
    'gray',
    'black'
  ];

  var vblank = function() {
  	X.Memory.w(0xFF0F, X.Memory.r(0xFF0F) & 1);
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
  	
    color: function(index, palette) {
    	var c = X.Utils.bit(this[palette], index*2) | X.Utils.bit(this[palette], index*2+1) << 1;
      if (c == 0) return 'rgb(255,255,255)';
      if (c == 1) return 'rgb(150,150,150)';
      if (c == 2) return 'rgb(75,75,75)';
      if (c == 3) return 'rgb(0,0,0)';
    },

    // DMA transfer

    sprite: {
      position: [],
      number: 0
    },

    init: function() {

      canvas = document.querySelector('section#game canvas');
      canvas_ctx = canvas.getContext('2d');

      setInterval(this.draw_frame.bind(this), 1000);
    },

    draw_frame: function() {

    	canvas_ctx.clearRect(0, 0, 256, 256);

      for (var y = 0; y < 32; ++y) {
        for (var x = 0; x < 32; ++x) {

          var tile = X.Memory.r(this.bg_tile_map + y*32 + x);
          var pixels = X.Memory.r_(this.bg_window_tile_data + tile * 16, 16);

          for (var py = 0; py < 16; py += 2 ) {
            for (var px = 0; px < 8; ++px) {

              var a = X.Utils.bit(pixels[py], px);
              var b = X.Utils.bit(pixels[py+1], px);
              var c = a | b << 1;

              canvas_ctx.fillStyle = this.color(c, 'bg_palette');
              canvas_ctx.fillRect(x*8 + (8-px), y*8 + py/2, 1, 1);
            }
          }
        }
      }

      canvas_ctx.strokeRect(this.scroll_x, this.scroll_y, 160, 144);

      this.line_y = 0x90;
      vblank();
    },
  	
  };
  
})(X || {});
