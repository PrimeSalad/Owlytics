
import fs from 'fs';
const xml = fs.readFileSync('server/src/assets/temp_template_2/word/document.xml', 'utf8');
const tags = xml.match(/\{[^\}]+\}/g);
console.log(JSON.stringify([...new Set(tags)], null, 2));
