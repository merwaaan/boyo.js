var X = X || {};

X.Memory = (function() {

  'use strict';

  var mapping = [];

  var map = function(address, ref) {
    mapping[address] = ref;
  };

  var map_range = function(start_address, end_address, ref) {
    for (var a = start_address; a <= end_address; ++a)
      mapping[a] = ref;
  };

  var wram, wram_data;
  var nouse, nouse_data;
  var io, io_data;
  var hram, hram_data;

  return {

    r: function(address) {

      if (mapping[address] && mapping[address].r)
        return mapping[address].r(address);

      console.error('Unmapped address (r): ' + X.Utils.hex16(address));
      return 0;
    },

    r_: function(address, length) {

      var slice = [];

      for (var a = address; a < address + length; ++a) {
        slice.push(this.r(a));
      }

      return slice;
    },

    w: function(address, value) {

      if (mapping[address] && mapping[address].w)
        mapping[address].w(address, value);
      else
        console.error('Unmapped address (w): ' + X.Utils.hex16(address));
    },

    init: function() {

      //

      wram = new ArrayBuffer(0x2000);
      wram_data = new Uint8Array(wram);

      nouse = new ArrayBuffer(0x5F);
      nouse_data = new Uint8Array(nouse);

      io = new ArrayBuffer(0x80);
      io_data = new Uint8Array(io);

      hram = new ArrayBuffer(0x80);
      hram_data = new Uint8Array(hram);

      // Map main ranges + specific registers

      map_range(0x0000, 0x7FFF, X.Cartridge); // ROM
      map_range(0x8000, 0x9FFF, X.Video); // VRAM
      map_range(0xA000, 0xBFFF, X.Cartridge); // RAM
      map_range(0xC000, 0xDFFF, {r: function(a){return wram_data[a-0xC000]}, w: function(a,v){wram_data[a-0xC000]=v}}); // WRAM
      map_range(0xE000, 0xFDFF, {r: function(a){return wram_data[a-0xC000]}, w: function(a,v){wram_data[a-0xC000]=v}}); // WRAM echo
      map_range(0xFE00, 0xFE9F, X.Video); // OAM
      map_range(0xFEA0, 0xFEFF, {r: function(a){return nouse_data[a-0xFEA0]}, w: function(a,v){nouse_data[a-0xFEA0]=v}}); // Not used (supposedly)
      map_range(0xFF00, 0xFF7F, {r: function(a){return io_data[a-0xFF00]}, w: function(a,v){io_data[a-0xFF00]=v}}); // IO
      map_range(0xFF80, 0xFFFF, {r: function(a){return hram_data[a-0xFF80]}, w: function(a,v){hram_data[a-0xFF80]=v}}); // HRAM

      map(0xFF00, X.Joypad); // Joypad
      map_range(0xFF10, 0xFF3F, X.Audio); // Audio
      map(0xFF46, {w: function(a,v){X.Video.dma_transfer(v)}}); // DMA transfer
      map_range(0xFF47, 0xFF49, {r: function(a){return io_data[a-0xFF00]}, w: function(a,v){X.Video.update_cached_palette(a,v); io_data[a-0xFF00]=v;}}); // Palettes
    },

    reset: function() {
      // Clear all RAM
      wram_data.fill(0);
      io_data.fill(0);
      nouse_data.fill(0);
      hram_data.fill(0);
    }

  };

})();
