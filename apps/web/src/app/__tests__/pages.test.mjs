import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const currentFile = fileURLToPath(import.meta.url);
const appDir = join(dirname(currentFile), '..', 'src', 'app');
console.log('Checking:', appDir);

function getPageFiles(dir) {
  const results = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        const nested = getPageFiles(fullPath);
        results.push(...nested);
      } else if (entry === 'page.tsx' || entry === 'page.ts') {
        results.push(fullPath);
      }
    }
  } catch (e) {
    console.error('Error reading dir:', e);
    return [];
  }
  return results;
}

const pageFiles = getPageFiles(appDir);
console.log(`Found ${pageFiles.length} page files:`);
pageFiles.forEach(f => console.log(`  ${f}`));

let allValid = true;
for (const file of pageFiles) {
  try {
    const content = readFileSync(file, 'utf-8');
    if (!content.includes('export default')) {
      console.error(`FAIL: ${file} - missing export default`);
      allValid = false;
    }
  } catch (e) {
    console.error(`FAIL: ${file} - ${e}`);
    allValid = false;
  }
}

if (allValid && pageFiles.length > 0) {
  console.log('✓ All page.tsx files export a default function');
  process.exit(0);
} else {
  console.error('✗ Test failed');
  process.exit(1);
}