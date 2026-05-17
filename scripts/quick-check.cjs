const fs = require('fs');
const s = fs.readFileSync('./src/db/questions_all.sql', 'utf8');
const lines = s.split('\n');

console.log('Double-quoted lines:', lines.filter(l => /^\s+"/.test(l)).length);
console.log('undefined values:', (s.match(/\bundefined\b/g) || []).length);
console.log('true), tuples:', (s.match(/true\),/g) || []).length);
console.log('true); final:', (s.match(/true\);/g) || []).length);
console.log('NNN tuples:', (s.match(/\),\n  \(SELECT/g) || []).length);
console.log('Ivoire: d*Ivoire check:');
lines.filter(l => l.includes('Ivoire')).forEach(l => console.log('  ' + l.trim()));
console.log('Flag quotes check:');
lines.filter(l => l.includes('flag is')).slice(0, 3).forEach(l => console.log('  ' + l.trim()));
console.log('NULL values:', (s.match(/\bNULL\b/g) || []).length);
console.log('"opponent" outside strings:', 
  lines.filter(l => l.includes('opponent')).filter(l => !l.startsWith("'") && !l.includes("'[")).length > 0 ? 'FOUND' : 'none');
