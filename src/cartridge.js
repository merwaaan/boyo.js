var X = X ||{};

X.Cartridge = (function() {

  'use strict';

  var rom;
  var rom_data;

  var ram;
  var ram_data;

  /*
   * Memory bank controllers
   */

  // Abstract MBC

  function MBC() {

    this.mode = 0;
    this.ram_enabled = false;

    this.rom_bank = 1;
    this.rom_bank_data = new Uint8Array(rom, 0x4000, 0x4000);

    this.ram_bank = 0;
    this.ram_bank_data = new Uint8Array(ram, 0, Math.min(X.Cartridge.ram_size, 0x2000));
  }

  MBC.prototype.switch_rom_bank = function(bank) {
    this.rom_bank = bank;
    this.rom_bank_data = new Uint8Array(rom, bank*0x4000, 0x4000);
  };

  MBC.prototype.switch_ram_bank = function(bank) {
    this.ram_bank = bank;
    this.ram_bank_data = new Uint8Array(ram, bank*0x2000, 0x2000); // XXX work with small rams?
  };

  MBC.prototype.r = function(address) {
    if (address < 0x4000)
      return rom_data[address];
    if (address < 0x8000)
      return this.rom_bank_data[address - 0x4000];
    if (this.ram_enabled)
      return this.ram_bank_data[address - 0xA000];
    return 0;
  };

  // No MBC

  function NoMBC() {
    MBC.call(this);
  }
  X.Utils.inherit(NoMBC, MBC);

  NoMBC.prototype.r = function(address) {
    return address < 0x8000 ? rom_data[address] : ram_data[address - 0xA000];
  };
  NoMBC.prototype.w = function(address, value) {
    return address < 0x8000 ? rom_data[address] = value : ram_data[address - 0xA000] = value;
  };

  // MBC1

  function MBC1() {
    MBC.call(this);
  }
  X.Utils.inherit(MBC1, MBC);

  MBC1.prototype.switch_rom_bank = function(bank) {
    if (bank == 0 || bank == 0x20 || bank == 0x40 || bank == 0x60) bank += 1;
    MBC.prototype.switch_rom_bank.call(this, bank);
  };

  MBC1.prototype.w = function(address, value) {
    if (address < 0x2000) { // XXX should check if there is RAM??
      this.ram_enabled = (value & 0xF) == 0xA;
    }
    else if (address < 0x4000) {
      var rom_bank = (this.rom_bank & 0x60) | (value & 0x1F);
      this.switch_rom_bank(rom_bank);
    }
    else if (address < 0x6000) {
      if (this.mode == 0) {
        this.switch_rom_bank(((value & 0x3) << 5) | (this.rom_bank & 0x1F));
      }
      else {
        this.switch_ram_bank(value & 0x3);
      }
    }
    else if (address < 0x8000) {
      this.mode = value & 1;
      if (this.mode == 0) {
        this.switch_ram_bank(0);
      }
      else {
        this.switch_rom_bank(this.rom_bank & 0x1F);
      }
    }
    else if (this.ram_enabled) {
      return this.ram_bank_data[address - 0xA000] = value;
    }
    return 0;
  };

  //

  var mbcs = {
    // code: [description, implementation]
    0x00: ['ROM ONLY', NoMBC],
    0x01: ['MBC1', MBC1],
    0x02: ['MBC1+RAM', MBC1],
    0x03: ['MBC1+RAM+BATTERY', MBC1],
    0x05: ['MBC2', NoMBC],
    0x06: ['MBC2+BATTERY', NoMBC],
    0x08: ['ROM+RAM', NoMBC],
    0x09: ['ROM+RAM+BATTERY', NoMBC],
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

    // TODO fix (no slice for typed arrays)
    get title() { return _.map(data.slice(0x134, 0x144), function(x) { return String.fromCharCode(x); }).join('').replace(/\s+/g, ' '); },
    get manufacturer() { return rom_data.slice(0x13F, 0x143); },
    get licensee() { return rom_data.slice(0x144, 0x146); },
    get destination() { return rom_data[0x14A]; },
    get version() { return rom_data[0x14C]; },

    get type() { return rom_data[0x147]; },
    get rom_size() { return 0x8000 << rom_data[0x148]; },
    get ram_size() { return ram_sizes[rom_data[0x149]]; },

    mbc: null,

    ready: false,

    init: function(buffer) {

      rom = buffer;
      rom_data = new Uint8Array(rom);

      ram = new ArrayBuffer(this.ram_size);
      ram_data = new Uint8Array(ram);

      var mbc_type = mbcs[this.type][1];

      if (!mbc_type) {
        this.ready = false;
        console.error(mbcs[this.type][0] + ' not supported yet');
      }
      else {
        this.mbc = new mbc_type();
        this.ready = true;
        console.info('Loaded program ' + this.to_string());
      }
    },

    to_string: function() {
      return '' + /*this.title +*/ ' [' + mbcs[this.type][0] + ']';
    },

    r: function(address) {
      return this.mbc.r(address);
    },

    w: function(address, value) {
      return this.mbc.w(address, value);
    }

  };

})();
