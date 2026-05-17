const fs = require('fs');
const s = fs.readFileSync('./src/db/questions_all.sql', 'utf8');
const lines = s.split('\n');

// Check for potential unescaped single quotes inside values
// A line like 'Some player's name' would have an odd number of quotes
let badLines = [];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  const quoteCount = (l.match(/'/g) || []).length;
  if (quoteCount % 2 !== 0 && !l.startsWith('--') && l.trim()) {
    badLines.push({ line: i + 1, text: l.trim().substring(0, 80) });
  }
}
console.log('Lines with odd single-quotes:', badLines.length);
badLines.slice(0, 10).forEach(b => console.log(`  ${b.line}: ${b.text}`));

// Check last lines
console.log('\nLast 4 lines:');
for (let i = lines.length - 4; i < lines.length; i++) {
  console.log(`  ${i+1}: ${lines[i]}`);
}

console.log('\nTotal lines:', lines.length);
console.log('Total rows starting with ((SELECT:', s.split('\n').filter(l => /^\s+\(SELECT/i.test(l)).length);
