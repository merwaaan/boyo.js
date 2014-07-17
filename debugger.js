var X = X || {};

X.Debugger = (function() {

  'use strict'
  
  return {

    registers: {},
    
    init: function() {
    
      // Buttons

      var buttons = document.querySelectorAll('button');
      buttons[0].addEventListener('click', function() { X.GB.pause(); });
      buttons[1].addEventListener('click', function() { X.GB.step(); });
      buttons[2].addEventListener('click', function() { X.GB.run(); });

      // Registers
      
      var cells = document.querySelector('table#registers').querySelectorAll('td');
      for (var c = 0; c < cells.length; ++c) {
        this.registers[cells[c].innerHTML[0]] = cells[c].querySelector('span');
      }
      
      watch(X.CPU.registers, function(prop, action, new_value) {
        this.registers[prop].innerHTML = '0x' + new_value.toString(16);
      }.bind(this));
      
      // Memory

      buttons[3].addEventListener('click', function() {

      });
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

})();
