#!/usr/bin/env python3

# Read the CSS file
with open(r'c:\invoice 2\src\index.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find where @media print ends
print_media_end = None
for i in range(len(lines) - 1, 1000, -1):  # Search backwards from the end, starting around line 1000
    if i > 1800 and lines[i].strip() == '}':
        # Check if this is likely the end of @media print
        # by looking at context
        context_start = max(0, i - 50)
        context = ''.join(lines[context_start:i+1])
        if '@media print' in context:
            print_media_end = i
            break

if print_media_end is None:
    print("Could not find @media print end")
    exit(1)

print(f"Found @media print end at line {print_media_end + 1}")

# Fix indentation: remove 4 leading spaces from lines after print_media_end
output_lines = lines[:print_media_end + 1].copy()

for i in range(print_media_end + 1, len(lines)):
    line = lines[i]
    # Remove 4 leading spaces if the line has them and isn't empty
    if line.startswith('    ') and line.strip():
        output_lines.append(line[4:])
    else:
        output_lines.append(line)

# Write the fixed content back
with open(r'c:\invoice 2\src\index.css', 'w', encoding='utf-8') as f:
    f.writelines(output_lines)

print("CSS file fixed successfully!")
