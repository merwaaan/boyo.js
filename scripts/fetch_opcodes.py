import collections
import re
import urllib2
from bs4 import BeautifulSoup

opcodes = [None] * 512

# Fetch opcode map

html = urllib2.urlopen('http://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html').read()
soup = BeautifulSoup(html);

# Extract the opcodes

for t, table in enumerate(soup.find_all('table')[:2]):
  for r, row in enumerate(table.find_all('tr')[1:]):
    for c, cell in enumerate(row.find_all('td')[1:]):
      
      # Ignore empty cells
      if len(cell.contents) == 1:
        continue

      opcode = int(hex(r) + hex(c)[2:], 16)
      
      # Ignore CB prefix cell
      if t == 0 and opcode == 0xCB:
        continue
        
      instruction = cell.contents[0].encode('utf-8')  
      specs = cell.contents[2].split()
      bytes = specs[0].encode('utf-8')
      cycles = specs[1].encode('utf-8')
      
      # Rename LD (HL+),A -> LDI (HL),A and similar instructions for convenience
      match = re.match('^.*\(HL([+|-])\).*$', instruction)
      if match:
        instruction = instruction.replace(match.group(1), '')
        instruction = instruction.replace('LD', 'LDI' if match.group(1) == '+' else 'LDD')
          
      opcodes[opcode if t == 0 else opcode + 0x100] = [instruction, bytes, cycles]
      #print(t,r,c)
    
# Output to JS

js = ('opcodes: ' + str(opcodes) + ',').replace('None', 'null')

with open('opcodes.txt', 'w') as file:
  file.write(js)
  file.close()