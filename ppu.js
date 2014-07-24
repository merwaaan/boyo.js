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

  return {

    // LCL control

    get LCDC() { return X.Memory.r(0xFF40); },
  	get display_enable() { return X.Utils.nth_bit(this.LCDC, 7); },
  	get window_tile_map() { return X.Utils.nth_bit(this.LCDC, 6) ? 0x9C00 : 0x9800; },
  	get window_enable() { return X.Utils.nth_bit(this.LCDC, 5); },
  	get bg_window_tile_data() { return X.Utils.nth_bit(this.LCDC, 4) ? 0x8000 : 0x8800; },
  	get bg_tile_map() { return X.Utils.nth_bit(this.LCDC, 3) ? 0x9C00 : 0x9800; },
  	get sprite_size() { return X.Utils.nth_bit(this.LCDC, 2) ? 16 : 8; },
  	get sprite_display_enable() { return X.Utils.nth_bit(this.LCDC, 1); },
  	get bg_display() { return X.Utils.nth_bit(this.LCDC, 0); },

    // STAT

    get STAT() { return X.Memory.r(0xFF41); },

    // Position and scrolling

  	get scroll_x() { return X.Memory.r(0xFF42); },
  	get scroll_y() { return X.Memory.r(0xFF43); },
  	get line_y() { return X.Memory.r(0xFF44); },
  	get line_y_compare() { return X.Memory.r(0xFF45); },
  	get window_x() { return X.Memory.r(0xFF4A); },
  	get window_y() { return X.Memory.r(0xFF4B); },

    // Palettes

  	get bg_palette() { return X.Memory.r(0xFF47); },
    get obj_palette_0() { return X.Memory.r(0xFF48); },
    get obj_palette_1() { return X.Memory.r(0xFF49); },
  	
    color: function(index, palette) {
      return (this[palette] & (0x3 << 2*index >> 2*index));
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

    rand_color: function() {
      var r = 255*Math.random() | 0;
      var g = 255*Math.random() | 0;
      var b = 255*Math.random() | 0;
      return 'rgb('+r+','+g+','+b+')';
    },

    draw_frame: function() {

      for (var y = 0; y < 32; ++y) {
        for (var x = 0; x < 32; ++x) {

          var tile_number = X.Memory.r(this.bg_tile_map + y*32 + x);
          var tile = X.Memory.r_(this.bg_window_tile_data + tile_number, 16);

          for (var ty = 0; ty < 16; ty += 2) {
            for (var tx = 0; tx < 8; ++tx) {
           
              var a = X.Utils.nth_bit(tile[ty], tx);
              var b = X.Utils.nth_bit(tile[ty+1], tx);
              var c = a | (b << 1);

              canvas_ctx.fillStyle = this.color(c, 'bg_palette');
              canvas_ctx.fillRect(x*8 + tx, y*8 + ty/2, 1, 1);
            }
          }
        }
      }

      //X.CPU.request_interrupt();
    },
  	
  };
  
})(X || {});
