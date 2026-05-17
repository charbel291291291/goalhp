const fs = require('fs');
const s = fs.readFileSync('./src/db/questions_all.sql', 'utf8');

// Check if "opponent" appears outside of single-quoted strings
const lines = s.split('\n');
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  // Skip lines that are entirely inside a string context
  // Look for "opponent" NOT inside single quotes
  const cleaned = l.replace(/'[^']*'/g, 'STR'); // replace quoted strings with placeholder
  if (/\bopponent\b/i.test(cleaned)) {
    console.log((i+1) + ': ' + l.trim().substring(0, 100));
  }
}

console.log('---');

// Also check for any double-quoted identifier with opponent
// This would appear as "opponent" with actual double quotes
const dqLines = lines.filter(l => l.includes('"opponent"') || l.includes('"opponent,') || l.includes('"opponent '));
if (dqLines.length === 0) {
  console.log('No "opponent" as double-quoted identifier found');
} else {
  dqLines.forEach(l => console.log(l.trim()));
}
