const fs = require('fs');
let sql = fs.readFileSync('C:/Users/Dell/Desktop/quizgoal26/src/db/questions_all.sql', 'utf8');

// Replace any remaining double-quoted strings with single-quoted strings
// Pattern: "any content" or "any content",
sql = sql.replace(/^(\s+)"((?:[^"\\]|\\.)*)"(,?)$/gm, (match, indent, content, comma) => {
  // Check if it's a boolean or number
  if (content === 'true' || content === 'false' || /^\d+$/.test(content)) return match;
  // Unescape any \" back to "
  content = content.replace(/\\"/g, '"');
  // Escape single quotes for PostgreSQL
  content = content.replace(/'/g, "''");
  return indent + "'" + content + "'" + (comma || '');
});

fs.writeFileSync('C:/Users/Dell/Desktop/quizgoal26/src/db/questions_all.sql', sql);
console.log('Fixed all remaining double-quoted strings');
