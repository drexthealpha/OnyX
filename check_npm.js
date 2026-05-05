const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const deps = fs.readFileSync('deps.txt', 'utf8').split('\n').filter(Boolean);

async function checkDep(dep) {
  try {
    const { stdout, stderr } = await execPromise(`npm view ${dep} version`, { timeout: 10000 });
    return { dep, exists: true, version: stdout.trim() };
  } catch (error) {
    if (error.message.includes('404') || error.message.includes('E404') || error.message.includes('not found') || error.message.includes('code E404')) {
      return { dep, exists: false, error: '404' };
    }
    return { dep, exists: false, error: error.message };
  }
}

async function run() {
  console.log(`Checking ${deps.length} dependencies...`);
  const results = [];
  const batchSize = 10;
  
  for (let i = 0; i < deps.length; i += batchSize) {
    const batch = deps.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(checkDep));
    results.push(...batchResults);
    process.stdout.write(`Checked ${Math.min(i + batchSize, deps.length)}/${deps.length}\r`);
  }
  
  console.log('\n\n--- RESULTS ---');
  const hallucinated = results.filter(r => !r.exists && r.error === '404');
  const errors = results.filter(r => !r.exists && r.error !== '404');
  
  if (hallucinated.length > 0) {
    console.log('❌ HALLUCINATED DEPENDENCIES:');
    hallucinated.forEach(h => console.log(`- ${h.dep}`));
  } else {
    console.log('✅ No hallucinated dependencies found.');
  }
  
  if (errors.length > 0) {
    console.log('\n⚠️  OTHER ERRORS:');
    errors.forEach(e => console.log(`- ${e.dep}: ${e.error.split('\n')[0]}`));
  }
}

run();
