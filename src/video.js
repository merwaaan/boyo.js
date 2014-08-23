var X = X || {};

X.Video = (function() {

  'use strict';

  var vram, vram_data;
  var oam, oam_data;

  var tile_data;
  var background_maps;

  var canvas;

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
    get lyc_interrupt() { return X.Utils.bit(this.STAT, 6); },
    get mode2_interrupt() { return X.Utils.bit(this.STAT, 5); },
    get mode1_interrupt() { return X.Utils.bit(this.STAT, 4); },
    get mode0_interrupt() { return X.Utils.bit(this.STAT, 3); },
    get lyc() { return X.Utils.bit(this.STAT, 2); }, set lyc(x) { X.Memory.w(0xFF41, this.STAT & 0xFB | x << 2) },
    get mode() { return this.STAT & 0x3; }, set mode(x) { X.Memory.w(0xFF41, this.STAT & 0x7C | x); },

    // Position and scrolling

    get scroll_y() { return X.Memory.r(0xFF42); },
    get scroll_x() { return X.Memory.r(0xFF43); },
    get line_y() { return X.Memory.r(0xFF44); }, set line_y(x) { X.Memory.w(0xFF44, x); },
    get line_y_compare() { return X.Memory.r(0xFF45); },
    get window_y() { return X.Memory.r(0xFF4A); },
    get window_x() { return X.Memory.r(0xFF4B); },

    // Palettes

    get bg_palette() { return X.Memory.r(0xFF47); },
    get obj_palette_0() { return X.Memory.r(0xFF48); },
    get obj_palette_1() { return X.Memory.r(0xFF49); },

    colors: [
      [0xFF, 0xFF, 0xFF, 0xFF],
      [0xAA, 0xAA, 0xAA, 0xFF],
      [0x50, 0x50, 0x50, 0xFF],
      [0, 0, 0, 0xFF]
    ],

    init: function() {

      X.Renderer.init();

      //

      vram = new ArrayBuffer(0x2000);
      vram_data = new Uint8Array(vram);

      oam = new ArrayBuffer(0xA0);
      oam_data = new Uint8Array(oam);

      tile_data = new Uint8Array(vram, 0, 0x1800);
      background_maps = new Uint8Array(vram, 0x1800, 0x800);

      // Switch to fullscreen when the canvas is clicked
      var canvas_dom = document.querySelector('div#game canvas');
      canvas_dom.addEventListener('click', function(event) {
        canvas_dom.webkitRequestFullScreen();
      });
      canvas = canvas_dom.getContext('2d');

      //

      for (var t = 0, l = this.cached_tiles.length; t < l; ++t) {
        var pixels = new Array(64);
        X.Utils.fill(pixels);
        this.cached_tiles[t] = pixels;
      }
    },

    reset: function() {

      X.Renderer.reset();

      // Cache default palettes to begin with
      _.each(['bg', 'obj_0', 'obj_1'], function(palette) {
        this.cached_palettes[palette] = [X.Video.colors[0], X.Video.colors[1], X.Video.colors[2], X.Video.colors[3]];
      }, this);

      this.mode = 2; // Really??
    },

    /**
      * Memory mapping
      */

    r: function(address) {

      // VRAM
      if (address < 0xA000) {
        return vram_data[address - 0x8000];
      }

      // OAM
      else {
        return oam_data[address - 0xFE00];
      }
    },

    w: function(address, value) {

      // VRAM
      if (address < 0xA000) {
        vram_data[address - 0x8000] = value;
        if (address < 0x9800)
          this.update_cached_tile(address - 0x8000);
      }

      // OAM
      else {
        oam_data[address - 0xFE00] = value;
      }
    },

    dma_transfer: function(value) {

      var starting_address = value * 0x100;

      for (var i = 0; i < 160; ++i) {
        oam_data[i] = X.Memory.r(starting_address + i);
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

    /**
      *
      */

    cached_palettes: {
      bg: [],
      obj_0: [],
      obj_1: []
    },

    update_cached_palette: function(address, value) {

      var palette;
      switch (address) {
        case 0xFF47: palette = 'bg'; break;
        case 0xFF48: palette = 'obj_0'; break;
        case 0xFF49: palette = 'obj_1'; break;
      }

      for (var b = 0; b < 4; ++b) {
        var color = this.colors[X.Utils.bit(value, b*2) | X.Utils.bit(value, b*2 + 1) << 1];
        this.cached_palettes[palette][b] = [color[0], color[1], color[2], color[3]];
      }
    },

    scan: function(cycles) {

      if (!this.display_enable)
        return;

      // Background
      if (this.bg_enable)
        X.Renderer.scan_background(this.line_y);

      // Window
      if (this.window_enable &&
          this.window_x >= 0 && this.window_x <= 166 &&
          this.window_y >= 0 && this.window_y <= 143)
        X.Renderer.scan_window(this.line_y);

      // Objects
      if (this.obj_enable)
        return; // TODO
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

      // Watch for STAT interrupts
      if (this.mode0_interrupt && m == 0 ||
          this.mode1_interrupt && m == 1 ||
          this.mode2_interrupt && m == 2)
        X.CPU.request_interrupt(1);
    },

    check_line_coincidence: function() {

      this.lyc = this.line_y == this.line_y_compare;

      if (this.lyc && this.lyc_interrupt)
        X.CPU.request_interrupt(1);
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
              this.check_line_coincidence();
            }
          }
          break;

        case 1: // V-Blank
          // line_y comparison during v-blank???
          this.line_y = 145 + Math.floor(this.mode_cycles/456);
          if (this.mode_cycles > this.mode_durations[1]) {
            this.change_mode(2);
            this.line_y = 0;
            this.check_line_coincidence();
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

  return {

    init: function() {

      //

      var canvas_dom = document.createElement('canvas');
      canvas_dom.width = 160;
      canvas_dom.height = 144;
      canvas = canvas_dom.getContext('2d', { alpha: false });

      buffer = canvas.createImageData(canvas_dom.width, canvas_dom.height);
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

        var color = X.Video.cached_palettes.bg[tile[py*8 + px]];

        // Draw the pixel

        this.scan_pixel(x, y, color);
      }
    },

    scan_window: function(y) {

      if (X.Video.line_y < X.Video.window_y)
        return;

      var sy = y - X.Video.window_y
      var ty = Math.floor(sy/8);
      var py = sy % 8;

      var x0 = Math.max(X.Video.window_x - 7, 0);
      var x1 = X.Video.window_x < 7 ? 160 - (7 - X.Video.window_x) : 160;

      for (var x = x0; x < x1; ++x) {

        var sx = x - X.Video.window_x + 7;
        var tx = Math.floor(sx/8);
        var px = sx % 8;

        // Fetch the tile

        var tile_number = X.Memory.r(X.Video.window_tile_map + ty*32 + tx);
        var tile_index = X.Video.bg_window_tile_data == 0x8000 ? tile_number : 256 + X.Utils.signed(tile_number);

        var tile = X.Video.cached_tiles[tile_index];

        // Fetch the pixel color

        var color = X.Video.cached_palettes.bg[tile[py*8 + px]];

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
        var attributes = X.Memory.r(address + 3);
        var obj_above = X.Utils.bit(attributes, 7);
        var flip_y = X.Utils.bit(attributes, 6);
        var flip_x = X.Utils.bit(attributes, 5);
        var palette = X.Utils.bit(attributes, 4) ? X.Video.cached_palettes.obj_1 : X.Video.cached_palettes.obj_0;

        var tile_size = X.Video.obj_size == 8 ? 1 : 2;

        for (var h = 0; h < tile_size; ++h) {

          var tile = X.Video.cached_tiles[tile_number + h];

          for (var y = 0; y < 8; ++y) {

            var py = pos_y + y + h*8;

            for (var x = 0; x < 8; ++x) {

              var px = pos_x + x;

              if (px >= 160 || py >= 144)
                continue;

              var color_index = tile[(flip_y ? 7-y : y)*8 + (flip_x ? 7-x : x)];
              if (color_index == 0)
                continue;

              this.scan_pixel(px, py, palette[color_index]);
            }
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
      destination_canvas.putImageData(buffer, 0, 0);
    },

    draw_tile_data: function(destination_canvas, tile_index, x, y) {

      var tile = X.Video.cached_tiles[tile_index];

      var buffer = destination_canvas.createImageData(8, 8);

      for (var py = 0; py < 8; ++py) {
        for (var px = 0; px < 8; ++px) {

          var color_index = tile[py*8 + px];
          var color = X.Video.cached_palettes.bg[color_index];

          var index = (py*8 + px) * 4;
          buffer.data[index] = color[0];
          buffer.data[index + 1] = color[1];
          buffer.data[index + 2] = color[2];
          buffer.data[index + 3] = color[3];
        }
      }

      destination_canvas.putImageData(buffer, x, y);
    },

    draw_background_map: function(destination_canvas, map) {

      for (var ty = 0; ty < 32; ++ty) {
        for (var tx = 0; tx < 32; ++tx) {
          var tile_number = X.Memory.r(map + ty*32 + tx);
          var tile_index = X.Video.bg_window_tile_data == 0x8000 ? tile_number : 256 + X.Utils.signed(tile_number);
          this.draw_tile_data(destination_canvas, tile_index, tx*8, ty*8);
        }
      }
    }

  };

})();
