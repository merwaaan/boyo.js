var X = X || {};

X.Video = (function() {

  'use strict';

  var vram, vram_data;
  var oam, oam_data;

  var tile_data;
  var background_maps;

  var canvas;

  var preset_palettes = [
    [0xFFFFFF, 0XAAAAAA, 0x505050, 0x000000], // Grayscale
    [0xC4CfA1, 0x8B956D, 0x4D533C, 0x1F1F1F], // Beige-ish
    [0xBED264, 0x80964E, 0x425B38, 0x042022], // Yellow-ish
    [0xDEBAD6, 0xDE7FC9, 0xF645CF, 0x8D2876], // Pink
    [0x000000, 0x505050, 0XAAAAAA, 0xFFFFFF], // Inverted grayscale
  ];

  return {

    // LCD control

    display_enable: 0,
    window_tile_map: 0,
    window_enable: 0,
    bg_window_tile_data: 0,
    bg_tile_map: 0,
    obj_size: 0,
    obj_enable: 0,
    bg_enable: 0,

    // STAT

    lyc_interrupt: 0,
    mode2_interrupt: 0,
    mode1_interrupt: 0,
    mode0_interrupt: 0,
    lyc: 0,
    mode: 0,

    // Position and scrolling

    scroll_y: 0,
    scroll_x: 0,
    line_y: 0,
    line_y_compare: 0,
    window_y: 0,
    window_x: 0,

    // Palettes

    bg_palette: 0,
    obj0_palette: 0,
    obj1_palette: 0,

    colors: [[], [], [], []],

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
      var canvas_dom = document.querySelector('#game canvas');
      canvas_dom.addEventListener('click', function(event) {
        var fullscreen = canvas_dom.webkitRequestFullScreen
              || canvas_dom.mozRequestFullScreen();
        if (fullscreen)
          fullscreen.call(canvas_dom);
      });
      canvas = canvas_dom.getContext('2d');

      // Fill the cached tiles

      for (var t = 0, l = this.cached_tiles.length; t < l; ++t) {
        var pixels = new Array(64);
        X.Utils.fill(pixels);
        this.cached_tiles[t] = pixels;
      }

      // Add a palette selection option in the settings

      for (var i in preset_palettes) {
        var preset = preset_palettes[i];

        var container = document.createElement('span');
        container.className = 'palette';

        (function() {
          var p = preset, c = container;
          c.addEventListener('click', function() {
            this.change_palette(p);
            var previous = document.querySelector('.palette.selected');
            if (previous) previous.className = 'palette';
            c.className += ' selected';
          }.bind(this));
        }.bind(this))();

        for (var j in preset) {
          var color = preset[j];
          var square = container.appendChild(document.createElement('span'));
          square.className = 'square';
          square.style.backgroundColor = '#' + (color >> 16 & 0xFF).toString(16) + (color >> 8 & 0xFF).toString(16) + (color & 0xFF).toString(16);
        }

        document.querySelector('section#settings section#palettes').appendChild(container);
      }

      document.querySelectorAll('.palette')[2].click();
    },

    reset: function() {

      X.Renderer.reset();

      // Cache default palettes to begin with
      _.each(['bg', 'obj0', 'obj1'], function(palette) {
        this.cached_palettes[palette] = [X.Video.colors[0], X.Video.colors[1], X.Video.colors[2], X.Video.colors[3]];
      }, this);

      this.mode = 2; // Really??

      // Clear RAM; don't need to clean tile_data and background_maps since they
      // are views into vram
      vram_data.fill(0);
      oam_data.fill(0);

      this.display_enable = 0;
      this.window_tile_map = 0;
      this.window_enable = 0;
      this.bg_window_tile_data = 0;
      this.bg_tile_map = 0;
      this.obj_size= 0;
      this.obj_enable= 0;
      this.bg_enable= 0;

      // STAT

      this.lyc_interrupt= 0;
      this.mode2_interrupt= 0;
      this.mode1_interrupt= 0;
      this.mode0_interrupt= 0;
      this.lyc= 0;
      this.mode= 0;

      // Position and scrolling

      this.scroll_y= 0;
      this.scroll_x= 0;
      this.line_y= 0;
      this.line_y_compare= 0;
      this.window_y= 0;
      this.window_x= 0;

      // Palettes

      this.bg_palette= 0;
      this.obj0_palette= 0;
      this.obj1_palette= 0;
    },

    /**
     * Memory mapping
     */

    read_oam: function(address) {
      return oam_data[address - 0xFE00]
    },

    read_vram: function(address) {
      return vram_data[address - 0x8000];
    },

    read_io: function(address) {
      var out = 0;

      switch (address) {
      case 0xff40:
        // Bit 7 - LCD Display Enable             (0=Off, 1=On)
        // Bit 6 - Window Tile Map Display Select (0=9800-9BFF, 1=9C00-9FFF)
        // Bit 5 - Window Display Enable          (0=Off, 1=On)
        // Bit 4 - BG & Window Tile Data Select   (0=8800-97FF, 1=8000-8FFF)
        // Bit 3 - BG Tile Map Display Select     (0=9800-9BFF, 1=9C00-9FFF)
        // Bit 2 - OBJ (Sprite) Size              (0=8x8, 1=8x16)
        // Bit 1 - OBJ (Sprite) Display Enable    (0=Off, 1=On)
        // Bit 0 - BG Display (for CGB see below) (0=Off, 1=On)
        out =  this.display_enable   << 7
          | this.window_tile_map     << 6
          | this.window_enable       << 5
          | this.bg_window_tile_data << 4
          | this.bg_tile_map         << 3
          | this.obj_size            << 2
          | this.obj_enable          << 1
          | this.bg_enable
        break;

      case 0xff41:
        // Bit 6 - LYC=LY Coincidence Interrupt (1=Enable) (Read/Write)
        // Bit 5 - Mode 2 OAM Interrupt         (1=Enable) (Read/Write)
        // Bit 4 - Mode 1 V-Blank Interrupt     (1=Enable) (Read/Write)
        // Bit 3 - Mode 0 H-Blank Interrupt     (1=Enable) (Read/Write)
        // Bit 2 - Coincidence Flag  (0:LYC<>LY, 1:LYC=LY) (Read Only)
        // Bit 1-0 - Mode Flag       (Mode 0-3, see below) (Read Only)
        //           0: During H-Blank
        //           1: During V-Blank
        //           2: During Searching OAM
        //           3: During Transferring Data to LCD Driver
        out = this.lyc_interrupt << 6
          | this.mode2_interrupt << 5
          | this.mode1_interrupt << 4
          | this.mode0_interrupt << 3
          | this.lyc             << 2
          | this.mode
        break;

      case 0xff42:
        // FF42 - SCY - Scroll Y (R/W)
        out = this.scroll_y;
        break;

      case 0xff43:
        // FF43 - SCX - Scroll X (R/W)
        out = this.scroll_x;
        break;

        // FF44 - LY - LCDC Y-Coordinate (R)
      case 0xff44:
        out = this.line_y;
        break;

      case 0xff45:
        // FF45 - LYC - LY Compare (R/W)
        out = this.line_y_compare;
        break;

        // FF46 - DMA - DMA Transfer and Start Address (W)

      case 0xff47:
        // FF47 - BGP - BG Palette Data (R/W)
        out = this.bg_palette;
        break;

      case 0xff48:
        // FF48 - OBP0 - Object Palette 0 Data (R/W)
        out = this.obj0_palette;
        break;

      case 0xff49:
        // FF49 - OBP1 - Object Palette 1 Data (R/W)
        out = this.obj1_palette;
        break;

      case 0xff4a:
        // FF4a - WY - Window Y Position (R/W)
        out = this.window_y;
        break;

      case 0xff4b:
        // FF4b - WX - Window X Position (R/W)
        out = this.window_x;
        break;
      }

      return out;
    },

    write_oam: function(address, value) {
      oam_data[address - 0xFE00] = value;
    },

    write_vram: function(address, value) {
      vram_data[address - 0x8000] = value;
      if (address < 0x9800)
        this.update_cached_tile(address - 0x8000);
    },

    write_io: function(address, value) {
      switch (address) {
      case 0xff40:
        // Bit 7 - LCD Display Enable             (0=Off, 1=On)
        // Bit 6 - Window Tile Map Display Select (0=9800-9BFF, 1=9C00-9FFF)
        // Bit 5 - Window Display Enable          (0=Off, 1=On)
        // Bit 4 - BG & Window Tile Data Select   (0=8800-97FF, 1=8000-8FFF)
        // Bit 3 - BG Tile Map Display Select     (0=9800-9BFF, 1=9C00-9FFF)
        // Bit 2 - OBJ (Sprite) Size              (0=8x8, 1=8x16)
        // Bit 1 - OBJ (Sprite) Display Enable    (0=Off, 1=On)
        // Bit 0 - BG Display (for CGB see below) (0=Off, 1=On)
        this.display_enable      = (value >> 7) & 1;
        this.window_tile_map     = (value >> 6) & 1;
        this.window_enable       = (value >> 5) & 1;
        this.bg_window_tile_data = (value >> 4) & 1;
        this.bg_tile_map         = (value >> 3) & 1;
        this.obj_size            = (value >> 2) & 1;
        this.obj_enable          = (value >> 1) & 1;
        this.bg_enable           = (value     ) & 1;
        break;

      case 0xff41:
        // Bit 6 - LYC=LY Coincidence Interrupt (1=Enable) (Read/Write)
        // Bit 5 - Mode 2 OAM Interrupt         (1=Enable) (Read/Write)
        // Bit 4 - Mode 1 V-Blank Interrupt     (1=Enable) (Read/Write)
        // Bit 3 - Mode 0 H-Blank Interrupt     (1=Enable) (Read/Write)
        // Bit 2 - Coincidence Flag  (0:LYC<>LY, 1:LYC=LY) (Read Only)
        // Bit 1-0 - Mode Flag       (Mode 0-3, see below) (Read Only)
        //           0: During H-Blank
        //           1: During V-Blank
        //           2: During Searching OAM
        //           3: During Transferring Data to LCD Driver
        this.lyc_interrupt   = (value >> 6) & 1;
        this.mode2_interrupt = (value >> 5) & 1;
        this.mode1_interrupt = (value >> 4) & 1;
        this.mode0_interrupt = (value >> 3) & 1;
        break;

      case 0xff42:
        // FF42 - SCY - Scroll Y (R/W)
        this.scroll_y = value;
        break;

      case 0xff43:
        // FF43 - SCX - Scroll X (R/W)
        this.scroll_x = value;
        break;

      case 0xff44:
        // FF44 - LY - LCDC Y-Coordinate (R/W)
        // Writing will reset the counter
        this.line_y = 0;
        break;

      case 0xff45:
        // FF45 - LYC - LY Compare (R/W)
        this.line_y_compare = value;
        break;

      case 0xff46:
        // FF46 - DMA - DMA Transfer and Start Address (R/W)
        this.dma_transfer(value);
        break;

      case 0xff47:
        // FF47 - BGP - BG Palette Data (R/W)
        this.bg_palette = value;
        this.update_cached_palette(address, value);
        break;

      case 0xff48:
        // FF48 - OBP0 - Object Palette 0 Data (R/W)
        this.obj0_palette = value;
        this.update_cached_palette(address, value);
        break;

      case 0xff49:
        // FF49 - OBP1 - Object Palette 1 Data (R/W)
        this.obj1_palette = value;
        this.update_cached_palette(address, value);
        break;

      case 0xff4a:
        // FF4a - WY - Window Y Position (R/W)
        this.window_y = value;
        break;

      case 0xff4b:
        // FF4b - WX - Window X Position (R/W)
        this.window_x = value;
        break;
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

    change_palette: function(colors) {

      for (var i in colors) {
        var color = colors[i];
        this.colors[i][0] = color >> 16 & 0xFF;
        this.colors[i][1] = color >> 8 & 0xFF;
        this.colors[i][2] = color & 0xFF;
        this.colors[i][3] = 0xFF;
      }

      this.update_cached_palette(0xFF47, this.bg_palette);
      this.update_cached_palette(0xFF48, this.obj0_palette);
      this.update_cached_palette(0xFF49, this.obj1_palette);
    },

    cached_palettes: {
      bg: [],
      obj0: [],
      obj1: []
    },

    update_cached_palette: function(address, value) {

      var palette;
      switch (address) {
      case 0xFF47: palette = 'bg'; break;
      case 0xFF48: palette = 'obj0'; break;
      case 0xFF49: palette = 'obj1'; break;
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

      this.lyc = (this.line_y == this.line_y_compare) ? 1 : 0;

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
            X.CPU.request_interrupt(0);
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
      // Clear canvas
      canvas.clearRect(0, 0, canvas.canvas.width, canvas.canvas.height);
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

        var tile_number = X.Memory.r((X.Video.bg_tile_map ? 0x9C00 : 0x9800) + ty*32 + tx);
        var tile_index = X.Video.bg_window_tile_data ? tile_number : 256 + X.Utils.signed(tile_number);

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

        var tile_number = X.Memory.r((X.Video.window_tile_map ? 0x9C00 : 0x9800) + ty*32 + tx);
        var tile_index = X.Video.bg_window_tile_data ? tile_number : 256 + X.Utils.signed(tile_number);

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
        var palette = X.Utils.bit(attributes, 4) ? X.Video.cached_palettes.obj1 : X.Video.cached_palettes.obj0;

        var tile_size = X.Video.obj_size ? 2 : 1;

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
          var tile_index = X.Video.bg_window_tile_data ? tile_number : 256 + X.Utils.signed(tile_number);
          this.draw_tile_data(destination_canvas, tile_index, tx*8, ty*8);
        }
      }
    }

  };

})();
