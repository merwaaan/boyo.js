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

    colors: [
      [1, 1, 1, 1],
      [0.7, 0.7, 0.7, 1],
      [0.4, 0.4, 0.4, 1],
      [0, 0, 0, 1]
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

  var scene;
  var camera;
  var renderer;
  var canvas;

  // Layers

  var bg_layer;
  var bg_colors;
  var bg_vertices;

  var window_layer;
  var window_colors;
  var window_vertices;

  var obj_layer;
  var obj_colors;
  var obj_vertices;

  // Cached palettes:

  var cached_bg_palette = [];
  var cached_obj_palette_0 = [];
  var cached_obj_palette_1 = [];

  // Shaders

  var vertex_shader = '\
    attribute vec4 a_color;\
    varying vec4 v_color;\
    void main() {\
      gl_PointSize = 1.0;\
      v_color = a_color;\
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);\
      gl_Position = projectionMatrix * mvPosition;\
    }';

  var fragment_shader = '\
    varying vec4 v_color;\
    void main() {\
      gl_FragColor = v_color;\
    }';

  return {

    init: function() {

      // Setup webGL

      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(0,256,0,256,0,10);
      renderer = new THREE.WebGLRenderer();
      renderer.setSize(256, 256);
      canvas = renderer.domElement;
      document.querySelector('section#game').appendChild(canvas);

      // Setup layers

      scene.add(bg_layer = new THREE.Object3D());
      scene.add(obj_layer = new THREE.Object3D());

      //

      var attributes = {
        a_color: {type: 'c', value: []}
      };
      bg_colors = attributes.a_color;

      var material = new THREE.ShaderMaterial({
        attributes: attributes,
        vertexShader: vertex_shader,
        fragmentShader: fragment_shader // TODO depth test necessary?
      });

      var geometry = new THREE.Geometry();
      for (var y = 0; y < 256; ++y) {
        for (var x = 0; x < 256; ++x) {

          var pixel = new THREE.Vector3(x, y, 0);
          geometry.vertices.push(pixel);

          bg_colors.value.push(new THREE.Color(1, 1, 1));
        }
      }

      var pixels = new THREE.PointCloud(geometry, material);
      bg_layer.add(pixels);


      // Maintain cached palettes for faster access

      var palettes = [cached_bg_palette, cached_obj_palette_0, cached_obj_palette_1];
      
      _.each(palettes, function(palette, index) {
        X.Memory.watch(0xFF47 + index, function(prop, old_val, new_val) {
          for (var b = 0; b < 4; ++b) {
            var color = X.Video.colors[X.Utils.bit(new_val, b*2) | X.Utils.bit(new_val, b*2 + 1) << 1];
            palette[b] = new THREE.Color(color[0], color[1], color[2]);
          }
        });
      });
    },

    reset: function() {

    },

    scan_background: function(y) {

      var ty = Math.floor(y/8);
      var py = y % 8;

      for (var x = 0; x < 256; ++x) {
        
        // Fetch the tile

        var tx = Math.floor(x/8);

        var tile_number = X.Memory.r(X.Video.bg_tile_map + ty*32 + tx);
        var tile_index = X.Video.bg_window_tile_data == 0x8000 ? tile_number : 256 + X.Utils.signed(tile_number);

        var tile = X.Video.cached_tiles[tile_index];
        
        // Fetch the pixel color

        var px = x % 8;
        var color = cached_bg_palette[tile[py*8 + px]];

        // Draw the pixel

        this.scan_pixel(bg_layer, x, y, color);
      }
    },

    scan_pixel: function(layer, x, y, color) {

      bg_colors.value[y*256 + x] = color;
      bg_colors.needsUpdate = true;
    },

    draw_frame: function(destination_canvas) {

      this.draw_background(destination_canvas, true);
      this.draw_obj(destination_canvas);
    },

    draw_background: function(destination_canvas, scrolling, wrapping) {

      renderer.render(scene, camera); // XXX Where should I do that?!
return;
      var sx = scrolling ? X.Video.scroll_x : 0;
      var sy = scrolling ? X.Video.scroll_y : 0;

      destination_canvas.drawImage(canvas, sx, sy, 160, 144, 0, 0, 160, 144);
    },

    draw_obj: function(destination_canvas) {

    }

  };

})();

/*
    frame_obj: function(canvas) {

      for (var o = 0; o < 40; ++o) {

        var index = o*4;
        var pos_y = X.Memory.r(0xFE00 + index);
        var pos_x = X.Memory.r(0xFE00 + index + 1);

        // Skip the object if it is hidden off-screen
        if (pos_y == 0 || pos_y >= 160 || pos_x == 0 || pos_x >= 168)
          continue;

        pos_y -= 16;
        pos_x -= 8;

        var tile_number = X.Memory.r(0xFE00 + index + 2);
        var attributes = X.Memory.r(0xFE00 + index + 3);

        var tile = X.Video.cached_tiles[tile_number];

        for (var y = 0; y < 8; ++y) {
          for (var x = 0; x < 8; ++x) {
            var color = X.Video.cached_bg_colors[tile[y*8 + x]];
            this.draw_pixel(obj_buffer, pos_x + x, pos_y + y, color);            
          }
        }
      }

      canvas.bufferData(canvas.ARRAY_BUFFER, obj_buffer, canvas.STATIC_DRAW);
      canvas.drawArrays(canvas.TRIANGLES, 0, 160*144*6);
    }
*/