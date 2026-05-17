const fs = require('fs');
const sql = fs.readFileSync('./src/db/questions_all.sql', 'utf8');
const lines = sql.split('\n');
const dq = lines.filter(l => /^\s+"/.test(l));
console.log('Double-quoted lines remaining:', dq.length);
dq.slice(0, 5).forEach(l => console.log(l.trim()));
