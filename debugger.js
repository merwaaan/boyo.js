var X = X || {};

X.Debugger = {

  registers: {},
  memory: [],
  
  init: function() {
  
    // Registers
    
    var cells = document.querySelector('table#registers').querySelectorAll('td');
    for (var c = 0; c < cells.length; ++c) {
      this.registers[cells[c].innerHTML[0]] = cells[c].querySelector('span');
    }
    
    watch(X.CPU.registers, function(prop, action, new_value) {
      this.registers[prop].innerHTML = '0x' + new_value.toString(16);
    }.bind(this));
    
    // Memory
    /*
    var table = document.querySelector('table#memory');
    for (var c = 0; c < 50; ++c) {
      var row = table.appendChild(document.createElement('tr'));
      row.appendChild(document.createElement('td')).innerHTML = '0x' + c.toString(16);
      this.memory[c] = row.appendChild(document.createElement('td'));
    }
    
    watch(X.CPU.memory, function(prop, action, new_value) {
      this.memory[prop].innerHTML = '0x' + new_value.toString(16);
    }.bind(this));*/
  },
  
};