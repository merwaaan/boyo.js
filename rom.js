function Rom(data) {

  this.data = [];
  this.addresses = {};

  this.load(data);
}

Rom.prototype.load = function(data) {

  // Split data into a byte array
  for (var i = 0; i < data.length; i++) {
    this.data.push(data.charCodeAt(i));
  }
  /*c = document.createElement('p');
  c.innerHTML = '['+this.data.join(', ')+']';
  document.body.appendChild(c);*/
  
  //this.data = data;
  
  pos = this.read_header();
  pos = this.read_trainer(pos);
  pos = this.read_prg(pos);	
  pos = this.read_chr(pos);
};

Rom.prototype.read_header = function() {

  this.addresses['header'] = 0;

  // Read header

  this.constant = this.data.slice(0, 4);
  this.prg_rom_size = this.data[4];
  this.chr_rom_size = this.data[5];
  this.flag6 = this.data[6];
  this.flag7 = this.data[7];
  this.prg_ram_size = this.data[8];
  this.flag9 = this.data[9];
  this.flag10 = this.data[10];

  // Parse flags

  this.has_sram = (this.flag6 & 1<<1) !== 0;
  this.has_trainer = (this.flag6 & 1<<2) !== 0;
  this.has_playchoice = (this.flag7 & 1<<1) !== 0;
  this.is_ntsc = (this.flag9 & 1) !== 0;

  return 16;
};

Rom.prototype.read_trainer = function(pos) {

  this.addresses['trainer'] = pos;

  //

  return pos + (this.has_trainer ? 512 : 0);
};

Rom.prototype.read_prg = function(pos) {

  this.addresses['prg'] = []
  for (var i = 0; i < this.prg_rom_size; ++i) {
    this.addresses['prg'].push(pos + i * 16384);
  }

  //

  return pos + this.prg_rom_size * 16384;
};

Rom.prototype.read_chr = function(pos) {

  this.addresses['chr'] = []
  for (var i = 0; i < this.chr_rom_size; ++i) {
    this.addresses['chr'].push(pos + i * 8192);
  }

  return pos + this.chr_rom_size * 8192;
};
