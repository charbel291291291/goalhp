const fs = require('fs');
let sql = fs.readFileSync('C:/Users/Dell/Desktop/quizgoal26/src/db/questions_all.sql', 'utf8');

// Replace unescaped single quotes inside single-quoted strings
// We need to find strings like '["...d'Ivoire..."]' and escape the inner ' as ''
// Strategy: process each line. If a line starts with spaces then a single quote,
// it's a value string. Any ' inside (that isn't at the start/end) needs to be doubled.

const lines = sql.split('\n');
const fixed = lines.map(line => {
  const indent = line.match(/^\s*/)[0];
  const content = line.trim();
  
  // Only process lines that are single-quoted strings (start and end with ')
  if ((content.startsWith("'") && (content.endsWith("',") || content.endsWith("'"))) || 
      (content.startsWith("'") && content.includes("'") && content.endsWith(","))) {
    // Find the actual content between the outer quotes
    let trailing = '';
    let inner = content;
    if (inner.endsWith(',')) {
      trailing = ',';
      inner = inner.slice(0, -1);
    }
    if (inner.startsWith("'") && inner.endsWith("'")) {
      inner = inner.slice(1, -1);
      // Escape any single quotes inside the string by doubling them
      inner = inner.replace(/'/g, "''");
      return indent + "'" + inner + "'" + trailing;
    }
  }
  return line;
});

fs.writeFileSync('C:/Users/Dell/Desktop/quizgoal26/src/db/questions_all.sql', fixed.join('\n'));
console.log('Fixed apostrophes');
