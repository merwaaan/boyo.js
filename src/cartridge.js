var X = X ||{};

X.Cartridge = (function() {

	'use strict';

	var data = [];

  var MemoryBankControllers = {
    
    None: {
      
      r: function(address) {
        return address < 0x8000 ? data[address] : data[0x8000 + address - 0xA000];
      },
      
      w: function(address, value) {
        return address < 0x8000 ? data[address] = value : data[0x8000 + address - 0xA000] = value;
      }
    },

    MBC1: {

      ram_enable: false,
      rom_bank_lo: 1,
      rom_bank_hi: 0, // Alternatively used as RAM bank number
      mode: 0,

      r: function(address) {
        
        if (address < 0x4000) { // ROM Bank 0
          return data[address];
        }
        else if (address < 0x8000) { // ROM Bank n
          var rom_bank = this.rom_bank_lo | (this.mode == 0 ? this.rom_bank_hi << 5 : 0);
          if (rom_bank % 0x20 == 0) ++rom_bank;
          return data[rom_bank*0x4000 + address - 0x4000];
        }
        else { // RAM bank n
          var ram_bank = this.mode == 0 ? 0 : this.rom_bank_hi;
          return data[X.Cartridge.rom_size + ram_bank*0x2000 + address - 0xA000];
        }
      },
      
      // TODO optimize (better to compute banks once on w than more often on r)
      w: function(address, value) {
        
        if (address < 0x2000) {
          this.ram_enable = value == 0x0A;
        }
        else if (address < 0x4000) {
          this.rom_bank_lo = value;
        }
        else if (address < 0x6000) {
          this.rom_bank_hi = value;
        }
        else if (address < 0x8000) {
          this.mode = value;
        }
        else {
          var ram_bank = this.mode == 0 ? 0 : this.rom_bank_hi;
          return data[X.Cartridge.rom_size + ram_bank*0x2000 + address - 0xA000] = value;
        }
      }
    },
  };

  var mbcs = {
    // code: [description, implementation]
    0x00: ['ROM ONLY', MemoryBankControllers.None],
    0x01: ['MBC1', MemoryBankControllers.MBC1],
    0x02: ['MBC1+RAM', MemoryBankControllers.MBC1],
    0x03: ['MBC1+RAM+BATTERY', MemoryBankControllers.MBC1],
    0x05: ['MBC2', MemoryBankControllers.MBC2],
    0x06: ['MBC2+BATTERY', MemoryBankControllers.None],
    0x08: ['ROM+RAM', MemoryBankControllers.None],
    0x09: ['ROM+RAM+BATTERY', MemoryBankControllers.None],
    0x0B: ['MMM01', undefined],
    0x0C: ['MMM01+RAM', undefined],
    0x0D: ['MMM01+RAM+BATTERY', undefined],
    0x0F: ['MBC3+TIMER+BATTERY', undefined],
    0x10: ['MBC3+TIMER+RAM+BATTERY', undefined],
    0x11: ['MBC3', undefined],
    0x12: ['MBC3+RAM', undefined],
    0x13: ['MBC3+RAM+BATTERY', undefined],
    0x15: ['MBC4', undefined],
    0x16: ['MBC4+RAM', undefined],
    0x17: ['MBC4+RAM+BATTERY', undefined],
    0x19: ['MBC5', undefined],
    0x1A: ['MBC5+RAM', undefined],
    0x1B: ['MBC5+RAM+BATTERY', undefined],
    0x1C: ['MBC5+RUMBLE', undefined],
    0x1D: ['MBC5+RUMBLE+RAM', undefined],
    0x1E: ['MBC5+RUMBLE+RAM+BATTERY', undefined],
    0xFC: ['POCKET CAMERA', undefined],
    0xFD: ['BANDAI TAMA5', undefined],
    0xFE: ['HuC3', undefined],
    0xFF: ['HuC1+RAM+BATTERY', undefined]
  };

  var ram_sizes = [0, 0x800, 0x2000, 0x20000];

  return {

    get title() { return _.map(data.slice(0x134, 0x144), function(x) { return String.fromCharCode(x); }).join('').replace(/\s+/g, ' '); },
    get manufacturer() { return data.slice(0x13F, 0x143); },
    get licensee() { return data.slice(0x144, 0x146); }, // TODO old new
    get destination() { return data[0x14A]; },
    get version() { return data[0x14C]; },

    get type() { return data[0x147]; },
    get rom_size() { return 0x8000 << data[0x148]; },
    get ram_size() { return ram_sizes[data[0x149]]; },

    mbc: null,

    //ready: false,

  	init: function(bytes) {

      // TODO avoid this (directly keep an arraybuffer?)
      for (var i = 0; i < bytes.length; ++i)
        data[i] = bytes[i];
      
      this.mbc = mbcs[this.type][1];

      if (!this.mbc) {
        this.ready = false;
        console.error(mbcs[this.type][0] + ' not supported yet');
      }
      else {
        this.ready = true;
        console.info('Loaded program ' + this.to_string());
      }
  	},

    to_string: function() {
      return '' + this.title + ' [' + mbcs[this.type][0] + ']';
    },

  	r: function(address) {
      return this.mbc.r(address);
  	},

  	w: function(address, value) {

  		return this.mbc.w(address, value);
  	}

  };

})();
