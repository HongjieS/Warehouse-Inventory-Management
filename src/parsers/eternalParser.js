// src/parsers/eternalParser.js
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.entry";

// Ensure worker is properly configured
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * parsePDFEternal(arrayBuffer)
 *  For Eternal Ink style invoices
 */
export async function parsePDFEternal(arrayBuffer) {
  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let allText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      
      // Sort items by their vertical position (y) and then horizontal position (x)
      const items = content.items.sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5];
        if (Math.abs(yDiff) < 2) { // If y positions are close, sort by x
          return a.transform[4] - b.transform[4];
        }
        return yDiff;
      });

      // Group items by their vertical position to form lines
      let currentY = null;
      let currentLine = [];
      const lines = [];

      for (const item of items) {
        if (currentY === null || Math.abs(item.transform[5] - currentY) > 2) {
          if (currentLine.length > 0) {
            lines.push(currentLine.join(' '));
          }
          currentLine = [item.str];
          currentY = item.transform[5];
        } else {
          currentLine.push(item.str);
        }
      }
      if (currentLine.length > 0) {
        lines.push(currentLine.join(' '));
      }

      allText += lines.join('\n') + '\n';
    }

    // Split into lines and filter out empty lines and headers
    const lines = allText.split('\n')
      .filter(line => line.trim())
      .filter(line => !line.match(/^Page \d+$/))
      .filter(line => !line.match(/^(Item|Description|Ordered|Rate|Amount)$/))
      .filter(line => !line.match(/^Total$/));

    console.log('Filtered lines:', lines); // Debug logging
    
    const results = [];
    
    for (const line of lines) {
      // Add debug logging to see exact line content with visible spaces
      console.log('Processing line:', line.replace(/ /g, '·')); // Shows spaces as dots for debugging
      
      // Match the exact invoice format: Item Code, Description, Quantity, Rate, Amount
      // Even more flexible pattern that allows for variable spacing and optional spaces around numbers
      const match = line.match(/^\s*([A-Z0-9]+(?:-[0-9]+(?:\/[0-9]+)?(?:NB)?)?)\s+(.*?)\s+(\d+(?:,\d+)?)\s+[\d,.]+\s+[\d,.]+\s*$/);
      
      if (match) {
        const [, itemCode, description, qtyStr] = match;
        console.log('Matched components:', { itemCode, description, qtyStr }); // Debug matched components
        const quantity = parseInt(qtyStr.replace(/,/g, ''), 10);

        // Extract size from item code or description
        let size = "1 ounce"; // default
        if (itemCode.includes("-1/2") || description.includes("1/2 ounce")) {
          size = "1/2 ounce";
        } else if (itemCode.includes("-4") || description.includes("4 ounce")) {
          size = "4 ounce";
        } else if (itemCode.includes("-2") || description.includes("2 ounce")) {
          size = "2 ounce";
        }

        // Clean up color name
        const color = description
          .replace(/-1 ounce Bottle/i, "")
          .replace(/-1\/2 ounce/i, "")
          .replace(/-4 ounce/i, "")
          .replace(/-2 ounce/i, "")
          .replace(/\s*Bottle.*$/i, "") // Remove "Bottle" and anything after it
          .replace(/\s*Set.*$/i, "") // Remove "Set" and anything after it
          .trim();

        // Standardize size to 'X oz' format
        function standardizeSize(size) {
          if (!size) return '';
          const match = size.match(/([\d.\/]+)\s*(ounce|oz)/i);
          if (match) {
            let num = match[1];
            // Convert '1/2' to '0.5'
            if (num.includes('/')) {
              const [n, d] = num.split('/').map(Number);
              num = (n / d).toString();
            }
            return `${num} oz`;
          }
          return size;
        }

        // Skip discount lines and empty colors
        if (!itemCode.includes("Discount") && color && !color.match(/^(ounce|Bottle|Bottles)$/i)) {
          results.push({
            itemCode,
            color,
            quantity,
            size: standardizeSize(size)
          });
          console.log('Successfully parsed item:', { itemCode, color, quantity, size: standardizeSize(size) }); // Debug logging
        }
      } else {
        console.log('Line did not match pattern:', line); // Debug logging
      }
    }

    if (results.length === 0) {
      console.error('No items could be parsed from the PDF');
      throw new Error('No items could be parsed from the PDF');
    }

    console.log('Parsed results:', results); // Debug logging
    return results;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}
