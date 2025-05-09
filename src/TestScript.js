// Test script to directly check if our parser can parse the Invoice 5099.pdf file
import * as fs from 'fs';
import * as path from 'path';
import { parsePDFSolidInk } from './parsers/solidInkParser';

// Use Node.js APIs to read the file
const filePath = path.join(process.cwd(), 'public', 'Invoice 5099.pdf');
console.log('Attempting to read file:', filePath);

fs.readFile(filePath, async (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }
  
  console.log('File read successfully. Size:', data.length);
  
  // Convert to ArrayBuffer for PDF.js
  const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  
  try {
    console.log('Parsing invoice...');
    const items = await parsePDFSolidInk(arrayBuffer);
    console.log('Parser returned', items.length, 'items:');
    console.log(JSON.stringify(items, null, 2));
  } catch (error) {
    console.error('Parser error:', error);
  }
}); 