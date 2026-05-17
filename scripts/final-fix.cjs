const fs = require('fs');
let sql = fs.readFileSync('./src/db/questions_all.sql', 'utf8');

// 1. Replace all undefined with NULL
sql = sql.replace(/\bundefined\b/g, 'NULL');

// 2. Fix any mid-file true); that should be true),
// Split into lines, process
let lines = sql.split('\n');

// Find which line is the very last closing tuple
let lastTupleLine = -1;
for (let i = lines.length - 1; i >= 0; i--) {
  if (/^\s+true\);/.test(lines[i])) {
    lastTupleLine = i;
    break;
  }
}

// Fix all true); that are NOT the last tuple
for (let i = 0; i < lines.length; i++) {
  if (i !== lastTupleLine && /^\s+true\);/.test(lines[i])) {
    lines[i] = lines[i].replace(/\);/, '),');
  }
}

sql = lines.join('\n');

fs.writeFileSync('./src/db/questions_all.sql', sql);
console.log('Done. Replaced undefined with NULL, fixed mid-file semicolons.');
console.log('Last tuple is line', lastTupleLine + 1);
