const fs = require('fs');
const path = require('path');

const SOURCES = [
  'questions_500.sql',
  'questions_more.sql',
  'questions_final.sql',
  'questions_last.sql'
];

const DB_DIR = 'C:/Users/Dell/Desktop/quizgoal26/src/db';

function parseSourceFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const rows = [];
  let inValues = false;
  let currentRow = [];

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];

    // Find start of VALUES section (VALUES keyword on same line as INSERT)
    if (line.includes('INSERT INTO quiz_questions')) {
      if (line.includes('VALUES')) inValues = true;
      continue;
    }
    if (!inValues) continue;

    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip comment lines
    if (trimmed.startsWith('--')) continue;

    // Detect start of a new row (case-insensitive SELECT)
    if (/^\(\(?SELECT/i.test(trimmed)) {
      if (currentRow.length >= 10) {
        rows.push(currentRow);
      }
      currentRow = [];
      // Original: ((SELECT...) → strip tuple paren, keep subquery paren
      let firstField = trimmed;
      if (firstField.endsWith(',')) firstField = firstField.slice(0, -1);
      if (firstField.startsWith('((')) firstField = firstField.slice(1);
      currentRow.push(firstField);
      continue;
    }

    // Remove trailing comma
    let field = trimmed;
    if (field.endsWith(',')) field = field.slice(0, -1);

    // Check if this is the last field (true) or true);
    if (field === 'true)' || field === 'true);') {
      currentRow.push('true');
      if (currentRow.length >= 10) rows.push(currentRow);
      currentRow = [];
      continue;
    }

    currentRow.push(field);
  }

  // Push any remaining row
  if (currentRow.length >= 10) rows.push(currentRow);

  return rows;
}

function toPgLiteral(val) {
  if (val === null || val === undefined) return 'NULL';
  let v = String(val).trim();

  // Subquery: (SELECT ...) preserve as-is
  if (v.startsWith('(SELECT') || v.startsWith('((SELECT')) return v;

  // Boolean, integer, or undefined → NULL
  if (v === 'true' || v === 'false' || /^\d+$/.test(v)) return v;
  if (v === 'undefined') return 'NULL';

  // Already single-quoted
  if (v.startsWith("'") && v.endsWith("'")) return v;

  // Double-quoted string: unescape and re-quote
  if (v.startsWith('"')) {
    let inner = v.replace(/^"/, '').replace(/"$/, '');
    inner = inner.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    inner = inner.replace(/'/g, "''");
    return "'" + inner + "'";
  }

  return "'" + v.replace(/'/g, "''") + "'";
}

// Process all source files
let allQuestions = [];

for (const srcFile of SOURCES) {
  const srcPath = path.join(DB_DIR, srcFile);
  if (!fs.existsSync(srcPath)) {
    console.log('Skipping:', srcFile);
    continue;
  }
  const rows = parseSourceFile(srcPath);
  const cleaned = rows.map(fields => fields.map(f => toPgLiteral(f)));
  allQuestions.push(...cleaned);
  console.log(`${srcFile}: ${rows.length} rows`);
}

console.log(`Total parsed: ${allQuestions.length}`);

// Show first few rows for debugging
for (let i = 0; i < Math.min(3, allQuestions.length); i++) {
  const q = allQuestions[i];
  console.log(`\nRow ${i+1}: ${q.length} fields`);
  console.log(`  Field 0: ${q[0]}`);
  console.log(`  Field 1: ${q[1]}`);
  console.log(`  Field 9: ${q[9]}`);
}

// Deduplicate
const seen = new Set();
const unique = [];
for (const q of allQuestions) {
  const key = q[1] ? q[1].toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  if (key && !seen.has(key)) {
    seen.add(key);
    unique.push(q);
  } else if (!key) {
    unique.push(q);
  }
}
console.log(`\nUnique: ${unique.length}`);

// Write output
let sql = `-- QuizGoal 2026 — All Questions Seed (clean)
-- ${unique.length} unique questions

DELETE FROM quiz_battle_answers;
DELETE FROM quiz_questions;

INSERT INTO quiz_questions (category_id, question_en, question_ar, answers_en, answers_ar, correct_answer_index, difficulty, explanation_en, explanation_ar, active) VALUES\n`;

unique.forEach((q, idx) => {
  const isLast = idx === unique.length - 1;
  sql += `  (${q[0]},\n`;
  sql += `  ${q[1]},\n`;
  sql += `  ${q[2]},\n`;
  sql += `  ${q[3]},\n`;
  sql += `  ${q[4]},\n`;
  sql += `  ${q[5]},\n`;
  sql += `  ${q[6]},\n`;
  sql += `  ${q[7]},\n`;
  sql += `  ${q[8]},\n`;
  sql += `  ${q[9]})`;
  if (!isLast) sql += ',';
  sql += '\n';
});

sql += ';\n';

fs.writeFileSync(path.join(DB_DIR, 'questions_all.sql'), sql);
console.log('Written to questions_all.sql');
