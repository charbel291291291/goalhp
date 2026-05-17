const fs = require('fs');
let sql = fs.readFileSync('C:/Users/Dell/Desktop/quizgoal26/src/db/questions_all.sql', 'utf8');

// Fix 1: Simple string values from "..." to '...'
sql = sql.replace(/^(\s+)"([^"\\]+)"(,?)$/gm, '$1' + "'" + '$2' + "'" + '$3');

// Fix 2: JSON array strings from "[\"...\",...]" to '["...",...]'
sql = sql.replace(/^(\s+)"(\[.*\])"(,?)$/gm, (m, indent, json, comma) => {
  // Remove escaped quotes inside the JSON
  json = json.replace(/\\"/g, '"');
  return indent + "'" + json + "'" + (comma || '');
});

fs.writeFileSync('C:/Users/Dell/Desktop/quizgoal26/src/db/questions_all.sql', sql);
console.log('Fixed all quoting');
