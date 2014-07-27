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

    cached_tiles: [],

    init: function() {

      canvas = document.querySelector('section#game canvas');
      canvas_ctx = canvas.getContext('2d');

      //

      for (var t = 0; t < 256; ++t) { // For each tile...

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

      //

      setInterval(this.draw_frame.bind(this), 1000);
    },

    draw_frame: function() {

    	canvas_ctx.clearRect(0, 0, 256, 256);

      var x0 = Math.floor(this.scroll_x / 32);
      var y0 = Math.floor(this.scroll_y / 32);

      for (var dy = 0; dy < 18; ++dy)
        for (var dx = 0; dx < 20; ++dx) {

          var tx = x0 + dx;
          var ty = y0 + dy;
          var tile_number = X.Memory.r(this.bg_tile_map + ty*32 + tx);

          var tile = canvas_ctx.createImageData(8, 8);
          X.Utils.cache_to_image(this.cached_tiles[tile_number], tile.data);
          canvas_ctx.putImageData(tile, dx*8, dy*8);
        }

      this.line_y = 0x90;
      vblank();
    },
  	
  };
  
})(X || {});
