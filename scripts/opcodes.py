import collections
import urllib2
from bs4 import BeautifulSoup

opcodes = [None] * 256

# Fetch opcode map

html = urllib2.urlopen('http://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html').read()
soup = BeautifulSoup(html);

# Extract the opcodes

table = soup.find('table')

for r, row in enumerate(table.find_all('tr')[1:]):
  for c, cell in enumerate(row.find_all('td')[1:]):
    
    if len(cell.contents) == 1:
      continue

    opcode = int(hex(r) + hex(c)[2:], 16)
    
    instruction = cell.contents[0].encode('utf-8')  
    specs = cell.contents[2].split()
    bytes = specs[0].encode('utf-8')
    cycles = specs[1].encode('utf-8')

    opcodes[opcode] = [instruction, bytes, cycles]
    
# Output to JS

js = ('XYZ.opcodes = ' + str(opcodes) + ';').replace('None', 'null')

file = open('opcodes.js', 'w')
file.write(js)
file.close()