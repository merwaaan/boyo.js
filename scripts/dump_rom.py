import sys

if len(sys.argv) < 2:
	print('usage: python dump_rom.py ROM_FILE [DUMP_NAME]')
	sys.exit()

file_name = sys.argv[1]
dump_name = sys.argv[2] if len(sys.argv) > 2 else '???'

with open(file_name, 'rb') as file:
  bytes = file.read()    
  file.close()
  
js = dump_name + ': [' + ','.join([hex(ord(byte)) for byte in bytes]) + '],'

with open(file_name + '.txt', 'w') as file:
  file.write(js)
  file.close()