with open('DMG_ROM.bin', 'rb') as file:
  bytes = file.read(256)    
  file.close()
  
js = 'bios: [' + ', '.join([hex(ord(byte)) for byte in bytes]) + '],'

with open('bios.txt', 'w') as file:
  file.write(js)
  file.close()