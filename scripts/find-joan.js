import fs from 'fs';

const fullLogPath = 'C:\\Users\\hanzc\\.gemini\\antigravity\\brain\\196741bb-3cd2-41ea-83aa-a284481f68ae\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(fullLogPath, 'utf8').split('\n');

lines.forEach((line) => {
  if (line.includes('"step_index":1930') || line.includes('"step_index":1931')) {
    try {
      const obj = JSON.parse(line);
      console.log(`=== STEP ${obj.step_index} (${obj.type}) ===`);
      console.log(typeof obj.content === 'string' ? obj.content : JSON.stringify(obj.content, null, 2));
    } catch (e) {}
  }
});
