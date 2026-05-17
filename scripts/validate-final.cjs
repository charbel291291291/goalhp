const fs = require('fs');
const sql = fs.readFileSync('./src/db/questions_all.sql', 'utf8');

const lines = sql.split('\n');
const inserts = (sql.match(/^INSERT INTO/gm) || []).length;
const openParens = (sql.match(/^\(\(SELECT/gm) || []).length;
const closeParens = (sql.match(/true\)[,;]/g) || []).length;
const undef = (sql.match(/\bundefined\b/g) || []).length;
const badSemicolons = lines.filter((l, i) => i !== lines.length - 1 && /^\s+true\);/.test(l)).length;
const doubleQuoted = (sql.match(/^  "/m) || []).length;
const singleQuotesInValue = (sql.match(/^  '[^']*'[^']*'/gm) || []).length;

console.log('=== VALIDATION ===');
console.log('INSERT statements:', inserts, '(should be 1)');
console.log('Value tuples (opening):', openParens, '(should be 503)');
console.log('Value tuples (closing):', closeParens, '(should be 503)');
console.log('undefined values:', undef, '(should be 0)');
console.log('Mid-file true);:', badSemicolons, '(should be 0)');
console.log('Double-quoted lines:', doubleQuoted, '(should be 0)');
console.log('Last line:', lines[lines.length - 1].trim() || '(empty line)');
console.log('=== SQL READY ===');
