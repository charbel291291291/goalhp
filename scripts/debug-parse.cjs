const fs = require('fs');
const content = fs.readFileSync('C:/Users/Dell/Desktop/quizgoal26/src/db/questions_500.sql', 'utf8');
const lines = content.split('\n');

// Show first 20 lines around VALUES
for (let i = 0; i < Math.min(30, lines.length); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
