import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.entry";

// Ensure worker is properly configured
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * Simple, direct parsing approach for Solid Ink invoices
 */
export async function parsePDFSolidInk(arrayBuffer) {
  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    let allLines = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      // Group items by vertical position (approximate lines)
      const lineMap = new Map();
      textContent.items.forEach(item => {
        const y = Math.round(item.transform[5]);
        if (!lineMap.has(y)) lineMap.set(y, []);
        lineMap.get(y).push({ text: item.str, x: item.transform[4] });
      });
      // Sort lines by y coordinate and combine items in each line
      const lines = Array.from(lineMap.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([_, items]) => items.sort((a, b) => a.x - b.x).map(item => item.text).join(' ').trim())
        .filter(line => line.length > 0);
      allLines = allLines.concat(lines);
    }

    // Remove header line(s) only
    allLines = allLines.filter(line => !/^SKU\s+Description\s+Unit Price\s+Pack Quantity\s+Amount$/i.test(line));

    // More robust regex: SKU, description, price, quantity (with comma), amount
    // Example: LIN1 Black Label | Lining Black - Size: 1oz $3.60 1,650 $5,940.00
    const itemPattern = /^(\w{3,5})\s+(.+?)\s+\$?([\d,.]+)\s+([\d,]+)\s+\$?([\d,.]+)$/;
    const items = [];
    for (const line of allLines) {
      const match = line.match(itemPattern);
      if (match) {
        const [, itemCode, description, , quantityStr] = match;
        // Try to extract size from description
        let size = '1 ounce';
        const sizeMatch = description.match(/(\d+\s*oz|ounce)/i);
        if (sizeMatch) size = sizeMatch[0].replace(/\s+/g, '');
        // Clean up color/description
        let color = description.replace(/-?\s*Size:?\s*\d+\s*oz|ounce/i, '').replace(/\|/g, '').trim();
        items.push({
          itemCode,
          color,
          quantity: parseInt(quantityStr.replace(/,/g, '')), 
          size
        });
      } else {
        // Debug: log lines that don't match
        if (line && !/^Invoice|^Sold To|^Shipping Address|^Payment Due|^Ship By|^Sales Rep|^Invoice Date|^Invoice No|^Paid|^\d{1,2}\/\d{1,2}\/\d{2,4}/i.test(line)) {
          console.log('Unmatched line:', line);
        }
      }
    }
    if (items.length === 0) throw new Error('No items could be parsed from the PDF');
    return items;
  } catch (error) {
    console.error('Error in Solid Ink parser:', error);
    throw error;
  }
} 