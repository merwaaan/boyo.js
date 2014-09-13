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
    if (address > 0x9FFF)
      ram_data[address - 0xA000] = value;
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
    if (address < 0x2000) {
      this.ram_enabled = (value & 0xF) == 0xA;
    }
    else if (address < 0x4000) {
      var rom_bank = (this.rom_bank & 0x60) | (value & 0x1F);
      this.switch_rom_bank(rom_bank);
    }
    else if (address < 0x6000) {
      if (this.mode == 0)
        this.switch_rom_bank(((value & 0x3) << 5) | (this.rom_bank & 0x1F));
      else
        this.switch_ram_bank(value & 0x3);
    }
    else if (address < 0x8000) {
      this.mode = value & 1;
      /*if (this.mode == 0)
        this.switch_ram_bank(0);
      else
        this.switch_rom_bank(this.rom_bank & 0x1F);*/
    }
    else if (this.ram_enabled) {
      this.ram_bank_data[address - 0xA000] = value;
    }
  };

  // MBC2

  function MBC2() {
    MBC.call(this);
  }
  X.Utils.inherit(MBC2, MBC);

  MBC2.prototype.w = function(address, value) {
    if (address < 0x2000 && !X.Utils.bit(address, 8)) {
      this.ram_enabled = !this.ram_enabled;
    }
    else if (address < 0x4000 && X.Utils.bit(address, 8)) {
      var rom_bank = value & 0xF;
      rom_bank = rom_bank === 0 ? 1 : rom_bank;
      this.switch_rom_bank(rom_bank);
    }
    else if (this.ram_enabled && address > 0x9FFF && address < 0xA200) {
      this.ram_bank_data[address - 0xA000] = value & 0xF;
    }
  };

  //

  var mbcs = {
    // code: [description, implementation]
    0x00: ['ROM ONLY', NoMBC],
    0x01: ['MBC1', MBC1],
    0x02: ['MBC1+RAM', MBC1],
    0x03: ['MBC1+RAM+BATTERY', MBC1],
    0x05: ['MBC2', MBC2],
    0x06: ['MBC2+BATTERY', MBC2],
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

  var save_ram = function() {

    // RAM data to base-64 string
    var string = btoa(String.fromCharCode.apply(null, ram_data));

    localStorage.setItem(X.Cartridge.title, string);
  };

  var restore_ram = function() {

    var save = localStorage.getItem(X.Cartridge.title);

    // Check if RAM for this cartridge has already been saved
    if (!save) {
      console.info('No RAM to restore')
      return;
    }

    // Base-64 string to RAM data
    ram_data.set(atob(save).split('').map(function(c) { return c.charCodeAt() }));

    console.info('RAM restored');
  };

  return {

    // TODO fix (no slice for typed arrays)
    get title() { return X.Utils.bytes_to_string(rom_data.subarray(0x134, 0x144)); },
    get manufacturer() { return X.Utils.bytes_to_string(rom_data.subarray(0x13F, 0x143)); },
    get licensee() { return X.Utils.bytes_to_string(rom_data.subarray(0x144, 0x146)); },
    get destination() { return rom_data[0x14A] == 0 ? 'Japanese' : 'Non-Japanese'; },
    get version() { return rom_data[0x14C]; },

    get type() { return rom_data[0x147]; },
    get rom_size() { return 0x8000 << rom_data[0x148]; },
    get ram_size() { return this.type != 0x5 && this.type != 0x6 ? ram_sizes[rom_data[0x149]] : 0x200; },
    get has_battery_ram() { return this.ram_size > 0 && mbcs[this.type][0].indexOf('BATTERY') > -1; },

    mbc: null,

    ready: false,

    init: function(buffer) {

      rom = buffer;
      rom_data = new Uint8Array(rom);

      ram = new ArrayBuffer(this.ram_size);
      ram_data = new Uint8Array(ram);

      // Setup the appropriate memory bank controller

      var mbc_type = mbcs[this.type][1];

      if (!mbc_type) {
        this.ready = false;
        console.error(mbcs[this.type][0] + ' not supported yet');
        return;
      }

      this.mbc = new mbc_type();
      this.ready = true;
      console.info('Loaded program ' + this.to_string());

      // Restore RAM if it is battery-backed

      if (this.has_battery_ram) {
        restore_ram();
      }

      // Save RAM when the window is closed
      window.addEventListener('unload', save_ram);
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
