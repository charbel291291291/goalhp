const fs = require('fs');
const s = fs.readFileSync('./src/db/questions_all.sql', 'utf8');
const lines = s.split('\n');

// Parse tuples by looking at parenthesis depth
let depth = 0;
let tupleCount = 0;
let currentTupleStart = 0;
let issues = [];

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  for (let j = 0; j < l.length; j++) {
    const ch = l[j];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
  }
  
  // Check for true), or true); lines which end a tuple
  if (/^\s+true\)[,;]/.test(l) || /^\s+true\);/.test(l)) {
    tupleCount++;
    // Verify depth is back to normal
    if (depth !== 0) {
      issues.push(`Line ${i+1}: Depth mismatch after tuple close (depth=${depth})`);
    }
  }
  
  if (/^\s+true\)/.test(l) && !/^\s+true\)[,;]/.test(l)) {
    issues.push(`Line ${i+1}: unusual true) without comma/semicolon`);
  }
}

console.log(`Tuple count: ${tupleCount}`);
console.log(`Final depth: ${depth}`);
if (issues.length > 0) {
  console.log(`Issues (${issues.length}):`);
  issues.slice(0, 20).forEach(iss => console.log('  ' + iss));
} else {
  console.log('No depth issues found');
}

// Check each line has consistent indentation
const indentValues = lines.filter(l => /^\s+\)/.test(l)).length;
console.log(`Lines starting with just ")" (should be isolated): ${indentValues}`);
