// Makes sure every case study carries the standard questions from
// src/data/case-questions.json. Missing ones are added (switched on, no
// answer) to the `questions` list in the file's frontmatter, in chapter order.
// Existing questions, answers and show/hide choices are never touched.
//
//   npm run questions
//
// Only chapters the case study actually has get questions.
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const standard = JSON.parse(fs.readFileSync('src/data/case-questions.json', 'utf8'));
const dir = 'src/content/work';
let added = 0;

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('._'))) {
  const full = path.join(dir, file);
  const src = fs.readFileSync(full, 'utf8');
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) continue;
  const data = yaml.load(m[1]) || {};
  const chapters = [...m[2].matchAll(/^##\s+(.+)$/gm)].map((c) => c[1].trim());
  const have = new Set((data.questions || []).map((q) => `${q.chapter}::${q.question}`));
  const missing = [];
  for (const chapter of chapters) {
    for (const { q } of standard[chapter] || []) {
      if (!have.has(`${chapter}::${q}`)) missing.push({ chapter, question: q, show: true });
    }
  }
  if (!missing.length) continue;
  data.questions = [...(data.questions || []), ...missing];
  const front = yaml.dump(data, { lineWidth: -1 }).trimEnd();
  fs.writeFileSync(full, `---\n${front}\n---\n${m[2].startsWith('\n') ? '' : '\n'}${m[2]}`);
  added += missing.length;
  console.log(`${file}: added ${missing.length}`);
}
console.log(added ? `Added ${added} question(s).` : 'Every case study already has the standard questions.');
