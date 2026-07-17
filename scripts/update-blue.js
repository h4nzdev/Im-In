import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('src');

function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(file));
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = getAllFiles(srcDir);
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Replace Hex Colors
  content = content.replace(/#2563eb/gi, '#054daf');
  content = content.replace(/#3b82f6/gi, '#054daf');
  content = content.replace(/#1d4ed8/gi, '#043e8a');
  content = content.replace(/#1e40af/gi, '#033373');
  content = content.replace(/#4f46e5/gi, '#054daf');

  // Replace RGBA Colors (matching regardless of whitespace after comma)
  content = content.replace(/rgba\(37,\s*99,\s*235/gi, 'rgba(5, 77, 175');
  content = content.replace(/rgba\(59,\s*130,\s*246/gi, 'rgba(5, 77, 175');
  content = content.replace(/rgba\(29,\s*78,\s*216/gi, 'rgba(4, 62, 138');
  content = content.replace(/rgba\(79,\s*70,\s*229/gi, 'rgba(5, 77, 175');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log(`Updated blue palette in: ${path.relative(process.cwd(), file)}`);
  }
});

console.log(`\nSuccessfully updated ${changedCount} file(s) to #054daf corporate blue.`);
