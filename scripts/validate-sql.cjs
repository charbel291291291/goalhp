const fs = require('fs');
const sql = fs.readFileSync('C:/Users/Dell/Desktop/quizgoal26/src/db/questions_all.sql', 'utf8');

const openParens = (sql.match(/^\(\(SELECT/gm) || []).length;
const closeParens = (sql.match(/true\)[,;]/g) || []).length;
const totalInserts = (sql.match(/INSERT INTO/g) || []).length;

console.log('INSERTS:', totalInserts);
console.log('Value rows (opening):', openParens);
console.log('Closing parens:', closeParens);
console.log('Match:', openParens === closeParens ? 'OK' : 'MISMATCH');
console.log('Ends with "true);":', sql.trim().endsWith('true);'));
console.log('No stray backslash-quotes:', !sql.includes("\\'"));
