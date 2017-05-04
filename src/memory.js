var X = X || {};

X.Memory = (function() {

  'use strict';

  var wram, wram_data;
  var nouse, nouse_data;
  var io, io_data;
  var hram, hram_data;

  return {

    r: function(address) {
      if (address < 0x8000) {
        // ROM
        return X.Cartridge.r(address);
      }
      else if (address < 0xA000) {
        // VRAM
        return X.Video.read_vram(address);
      }
      else if (address < 0xC000) {
        // RAM
        return X.Cartridge.r(address);
      }
      else if (address < 0xE000) {
        // WRAM
        return wram_data[address - 0xC000];
      }
      else if (address < 0xFE00) {
        // WRAM echo
        return wram_data[address - 0xE000];
      }
      else if (address < 0xFEA0) {
        // OAM
        return X.Video.read_oam(address);
      }
      else if (address < 0xFF00) {
        // Not used (supposedly)
        return nouse_data[address - 0xFEA0];
      }
      else if (address == 0xFF00) {
        // Joypad
        return X.Joypad.r(address);
      }
      else if (address < 0xFF10) {
        // misc IO
        return X.CPU.read(address);
        // return io_data[address - 0xFF00];
      }
      else if (address < 0xFF40) {
        // Audio
        return X.Audio.r(address);
      }
      else if (address < 0xFF4C) {
        // Video
        return X.Video.read_io(address);
      }
      else if (address < 0xFF80) {
        // misc IO
        return io_data[address - 0xFF00];
      }
      else if (address < 0xFFFF) {
        // HRAM
        return hram_data[address - 0xFF80];
      }
      else if (address == 0xFFFF) {
        // Interrupts
        return X.CPU.read(address);
      }
      else {
        throw new Error("read: Unmapped address: " + X.Utils.hex16(address));
      }
    },

    w: function(address, value) {
      if (address < 0x8000) {
        // ROM
        X.Cartridge.w(address, value);
      }
      else if (address < 0xA000) {
        // VRAM
        X.Video.write_vram(address, value);
      }
      else if (address < 0xC000) {
        // RAM
        X.Cartridge.w(address, value);
      }
      else if (address < 0xE000) {
        // WRAM
        wram_data[address - 0xC000] = value;
      }
      else if (address < 0xFE00) {
        // WRAM echo
        wram_data[address - 0xE000] = value;
      }
      else if (address < 0xFEA0) {
        // OAM
        X.Video.write_oam(address, value);
      }
      else if (address < 0xFF00) {
        // Not used (supposedly)
        nouse_data[address - 0xFEA0] = value;
      }
      else if (address == 0xFF00) {
        // Joypad
        X.Joypad.w(address, value);
      }
      else if (address < 0xFF10) {
        // misc IO
        X.CPU.write(address, value);
        // io_data[address - 0xFF00] = value;
      }
      else if (address < 0xFF40) {
        // Audio
        X.Audio.w(address, value);
      }
      else if (address < 0xFF4C) {
        // Video
        X.Video.write_io(address, value);
      }
      else if (address < 0xFF80) {
        // misc IO
        io_data[address - 0xFF00] = value;
      }
      else if (address < 0xFFFF) {
        // HRAM
        hram_data[address - 0xFF80] = value;
      }
      else if (address == 0xFFFF) {
        // Interrupts
        X.CPU.write(address, value);
      }
      else {
        throw new Error("write: Unmapped address: " + X.Utils.hex16(address));
      }
    },

    r_: function(address, length) {

      var slice = [];

      for (var a = address; a < address + length; ++a) {
        slice.push(this.r(a));
      }

      return slice;
    },

    init: function() {

      // Init

      wram = new ArrayBuffer(0x2000);
      wram_data = new Uint8Array(wram);

      nouse = new ArrayBuffer(0x5F);
      nouse_data = new Uint8Array(nouse);

      io = new ArrayBuffer(0x80);
      io_data = new Uint8Array(io);

      hram = new ArrayBuffer(0x80);
      hram_data = new Uint8Array(hram);
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
