import collections
import urllib2
from bs4 import BeautifulSoup

opcodes = collections.OrderedDict()

# Fetch opcode map

html = urllib2.urlopen('http://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html').read()
soup = BeautifulSoup(html);

# Extract the opcodes

table = soup.find('table')

for r, row in enumerate(table.find_all('tr')[1:]):
  for c, cell in enumerate(row.find_all('td')[1:]):
    
    if len(cell.contents) == 1:
      continue
      
    opcode = hex(r) + hex(c)[2:]

    instruction = cell.contents[0]
    
    specs = cell.contents[2].split()
    bytes = specs[0]
    cycles = specs[1]
    
    opcodes[opcode] = [instruction, bytes, cycles]
    
# Format to JS

for opcode, instruction in opcodes.items():
  print('ops[%s] = [\'%s\', %s, %s]' % (opcode, instruction[0], instruction[1], instruction[2]))
