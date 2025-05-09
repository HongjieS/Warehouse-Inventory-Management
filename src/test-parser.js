// Test script for directly parsing the Solid Ink invoice
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.entry";
import fs from 'fs';
import path from 'path';

// Ensure worker is properly configured
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

async function parseInvoice() {
  try {
    // Read the PDF file
    const filePath = path.resolve('./Invoice 5099.pdf');
    const data = fs.readFileSync(filePath);
    const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    
    console.log("Successfully read invoice file, size:", arrayBuffer.byteLength);

    // Parse the PDF
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log(`PDF has ${pdf.numPages} pages`);

    // Process each page
    let allItems = [];
    let allText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      console.log(`Page ${i} has ${textContent.items.length} text items`);
      
      // Log each text item with its position
      console.log(`Page ${i} raw items:`);
      textContent.items.forEach((item, index) => {
        console.log(`[${index}] x:${item.transform[4].toFixed(1)}, y:${item.transform[5].toFixed(1)}, text:'${item.str}'`);
      });

      // Group items by vertical position (approximate lines)
      const lineMap = new Map();
      textContent.items.forEach(item => {
        const y = Math.round(item.transform[5]); // Get y coordinate
        if (!lineMap.has(y)) {
          lineMap.set(y, []);
        }
        lineMap.get(y).push({
          text: item.str,
          x: item.transform[4],
          y: item.transform[5]
        });
      });

      // Sort lines by y coordinate (top to bottom) and combine items in each line
      const lines = Array.from(lineMap.entries())
        .sort((a, b) => b[0] - a[0]) // Sort by y coordinate (top to bottom)
        .map(([_, items]) => {
          // Sort items by x coordinate (left to right) and join
          return items
            .sort((a, b) => a.x - b.x)
            .map(item => item.text)
            .join(' ')
            .trim();
        })
        .filter(line => line.length > 0);

      // Log reconstructed lines
      console.log(`Page ${i} reconstructed lines:`);
      lines.forEach((line, index) => {
        console.log(`[${index}] '${line}'`);
      });

      allText += lines.join('\n') + '\n';
    }

    // Look for patterns that might be item entries
    console.log("\nSearching for potential item entries...");
    
    // Item codes like SI-XXXX
    const itemCodes = allText.match(/\b(SI-\d+)\b/gi);
    if (itemCodes) {
      console.log(`Found ${itemCodes.length} potential item codes:`, itemCodes);
    } else {
      console.log("No item codes found with pattern SI-XXXX");
    }
    
    // Look for lines with dollar amounts
    const priceLines = allText.split('\n')
      .filter(line => line.includes('$'))
      .map(line => line.trim());
    
    console.log(`\nFound ${priceLines.length} lines with dollar amounts:`);
    priceLines.forEach((line, i) => {
      console.log(`[${i}] ${line}`);
    });
    
    // Print out the entire text content for manual analysis
    console.log("\nComplete text content:");
    console.log(allText);
  } catch (error) {
    console.error('Error parsing PDF:', error);
  }
}

parseInvoice().then(() => console.log('Done')); 