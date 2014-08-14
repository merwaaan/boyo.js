import collections
import re
import urllib2
from bs4 import BeautifulSoup

# More explicit mnemonics

alternatives = {
  'LD A,(C)': 'LD A,($FF00+C)',
  'LD (C),A': 'LD ($FF00+C),A',
  'LDH A,(a8)': 'LD A,($FF00+a8)',
  'LDH (a8),A': 'LD ($FF00+a8),A',
  'LD A,(HL+)': 'LDI A,(HL)',
  'LD (HL+),A': 'LDI (HL),A',
  'LD A,(HL-)': 'LDD A,(HL)',
  'LD (HL-),A': 'LDD (HL),A'
}

# opcodes of flag-dependant instructions

flag_dependent = [
  0x20,
  0x28,
  0x30,
  0x38,
  0xC0,
  0xC2,
  0xC4,
  0xC8,
  0xCA,
  0xCC,
  0xD0,
  0xD2,
  0xD4,
  0xD8,
  0xDA,
  0xDC
]

# Fetch opcode map

html = urllib2.urlopen('http://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html').read()
soup = BeautifulSoup(html);

# Extract the opcodes

opcodes = [None] * 512

for t, table in enumerate(soup.find_all('table')[:2]):
  for r, row in enumerate(table.find_all('tr')[1:]):
    for c, cell in enumerate(row.find_all('td')[1:]):
      
      # Ignore empty cells
      if len(cell.contents) == 1:
        continue

      opcode = int(hex(r) + hex(c)[2:], 16) + t * 0x100
      
      # Ignore CB prefix cell
      if opcode == 0xCB:
        continue
        
      instruction = cell.contents[0].encode('utf-8')
      specs = cell.contents[2].split()
      bytes = int(specs[0].encode('utf-8'))
      cycles = [int(cycle) for cycle in specs[1].encode('utf-8').split('/')] # TODO handle X/Y cycles

      # Use alternative mnemonics for convenience
      if instruction in alternatives:
        instruction = alternatives[instruction]

      # Fix LD (C),A and LD (A),C typos
      if opcode == 0xE2 or opcode == 0xF2:
        bytes = 1
        
      # Fix JP (HL) -> JP HL
      if opcode == 0xE9:
        instruction = 'JP HL'

      # Homogenize d8, a8, r8, d16, a16 into d8, d16
      instruction = instruction.replace('a8', 'd8') ;
      instruction = instruction.replace('r8', 'd8') ;
      instruction = instruction.replace('a16', 'd16') ;

      # Switch to less ambiguous mnemonics for conditional flag statuses
      if opcode in flag_dependent:
        parts = instruction.split(' ')
        parameters = re.sub(r'(N?[CZ])', r'f\1', parts[1])
        instruction = parts[0] + ' ' + parameters

      opcodes[opcode] = [instruction, bytes, cycles]

    
# Output to JS

js = ('var opcode_specs = ' + str(opcodes) + ';').replace('None', 'null')

with open('opcodes.txt', 'w') as file:
  file.write(js)
  file.close()

print(js)
