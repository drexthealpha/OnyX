import os
import re
import json
import glob

deps = set()
# Regex to find dependencies in package.json content
# Looks for "package-name": "version" where version doesn't start with "workspace"
dep_pattern = re.compile(r'"(@?[a-z][a-z0-9\-\_\/\.]+)":\s*"(?!workspace)([^"]+)"')

package_json_files = glob.glob('packages/*/package.json') + glob.glob('apps/*/package.json') + ['package.json']

for file_path in package_json_files:
    try:
        with open(file_path, 'r') as f:
            content = f.read()
            matches = dep_pattern.findall(content)
            for pkg, ver in matches:
                deps.add(pkg)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

# Save to deps.txt
with open('deps.txt', 'w') as f:
    for dep in sorted(deps):
        f.write(dep + '\n')

print(f"Extracted {len(deps)} unique external dependencies.")
