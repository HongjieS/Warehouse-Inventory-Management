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
      const pageText = content.items.map((item) => item.str).join(" ");
      allText += pageText + "\n";
      console.log(`Page ${i} text:`, pageText); // Debug logging
    }

    // Split into lines and filter out empty lines and page markers
    const lines = allText.split('\n')
      .filter(line => line.trim())
      .filter(line => !line.match(/^Page \d+$/))
      .filter(line => !line.match(/^Sales Order/))
      .filter(line => !line.match(/^Date/))
      .filter(line => !line.match(/^Ship To/))
      .filter(line => !line.match(/^Total/));
    
    const results = [];

    for (const line of lines) {
      // Try to match the line pattern with more flexible spacing
      const match = line.match(/^([A-Z0-9]+(?:-[0-9]+(?:\/[0-9]+)?(?:NB)?)?)\s+([^0-9]+?)\s+(\d+(?:,\d+)?)\s+[\d.,]+\s+[\d.,]+$/);
      
      if (match) {
        const [, itemCode, description, qtyStr] = match;
        const quantity = parseInt(qtyStr.replace(/,/g, ''), 10);

        // Extract size from item code or description
        let size = "1 ounce"; // default
        if (itemCode.includes("-1/2")) {
          size = "1/2 ounce";
        } else if (itemCode.includes("-4")) {
          size = "4 ounce";
        } else if (itemCode.includes("-2")) {
          size = "2 ounce";
        } else if (description.includes("1 ounce") || description.includes("1oz")) {
          size = "1 ounce";
        } else if (description.includes("1/2 ounce") || description.includes("1/2oz")) {
          size = "1/2 ounce";
        } else if (description.includes("4 ounce") || description.includes("4oz")) {
          size = "4 ounce";
        } else if (description.includes("2 ounce") || description.includes("2oz")) {
          size = "2 ounce";
        }

        // Clean up color name
        const color = description
          .replace(/-1 ounce Bottle/i, "")
          .replace(/-1\/2 ounce/i, "")
          .replace(/-4 ounce/i, "")
          .replace(/-2 ounce/i, "")
          .replace(/-1oz/i, "")
          .replace(/-1\/2oz/i, "")
          .replace(/-4oz/i, "")
          .replace(/-2oz/i, "")
          .replace(/\s*\([^)]*\)/g, "") // Remove any parenthetical notes
          .replace(/\s*Set.*$/i, "") // Remove "Set" and anything after it
          .replace(/\s*Bottle.*$/i, "") // Remove "Bottle" and anything after it
          .replace(/\s*-1 ounce$/i, "") // Remove size suffix
          .replace(/\s*-1\/2 ounce$/i, "")
          .replace(/\s*-4 ounce$/i, "")
          .replace(/\s*-2 ounce$/i, "")
          .trim();

        // Skip discount lines and empty colors
        if (!itemCode.includes("Discount") && color && !color.match(/^(ounce|Bottle|Bottles)$/i)) {
          results.push({
            itemCode,
            color,
            quantity,
            size
          });
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