const fs = require('fs');
const content = fs.readFileSync('C:/Users/Dell/Desktop/quizgoal26/src/db/questions_500.sql', 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

// Find the INSERT and VALUES lines
for (let i = 0; i < 15; i++) {
  console.log(`${i}: charCode(0)=${lines[i].charCodeAt(0)} len=${lines[i].length}: [${lines[i].substring(0, 80)}]`);
}
