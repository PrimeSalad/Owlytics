
import fs from 'fs';

const xmlPath = 'server/src/assets/inspect_template/word/document.xml';
let xml = fs.readFileSync(xmlPath, 'utf8');

// Reset to a clean state (remove existing loops if any)
xml = xml.replace(/\{#activities\}/g, '').replace(/\{\/activities\}/g, '');
xml = xml.replace(/\{#photos\}/g, '').replace(/\{\/photos\}/g, '');

// 1. Add loop for Activities Table Row
// Find the row containing {activity title}
const rowRegex = /<w:tr [^>]*>(?:(?!<\/w:tr>).)*\{activity title\}(?:(?!<\/w:tr>).)*<\/w:tr>/s;
xml = xml.replace(rowRegex, (match) => `{#activities}${match}{/activities}`);

// 2. Add loop for the Documentation Section
// This section has {event}, {date}, and {details}
// It is inside a table <w:tbl>
// We'll wrap the ENTIRE table that contains {details} in {#activities}{/activities}
const docTableRegex = /<w:tbl>(?:(?!<\/w:tbl>).)*\{details\}(?:(?!<\/w:tbl>).)*<\/w:tbl>/s;
xml = xml.replace(docTableRegex, (match) => `{#activities}${match}{/activities}`);

// 3. Add loop for Photos
// Find paragraphs containing {photo} and wrap them in {#photos}{/photos}
// There are multiple paragraphs with {photo} potentially.
// We'll replace each occurrence of a paragraph containing {photo} with a looped version.
const photoParaRegex = /<w:p [^>]*>(?:(?!<\/w:p>).)*\{photo\}(?:(?!<\/w:p>).)*<\/w:p>/gs;
xml = xml.replace(photoParaRegex, (match) => {
  // If the paragraph has multiple {photo} tags (unlikely but possible), just keep one for the loop
  const cleanMatch = match.replace(/\{photo\}/g, '{photo}');
  // Ensure we only have one {photo} tag in the output match for docxtemplater to bind to
  const singlePhotoMatch = cleanMatch.replace(/\{photo\}/gs, 'TEMP_PHOTO').replace(/TEMP_PHOTO/s, '{photo}').replace(/TEMP_PHOTO/gs, '');
  return `{#photos}${singlePhotoMatch}{/photos}`;
});

fs.writeFileSync(xmlPath, xml);
console.log('XML updated successfully with robust regex');
