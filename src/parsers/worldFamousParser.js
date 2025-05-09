// src/parsers/worldFamousParser.js
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.entry";

// Ensure worker is properly configured
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * parsePDFWorldFamous(arrayBuffer)
 *  For World Famous / Ink Projects invoices
 */
export const parsePDFWorldFamous = async (arrayBuffer) => {
  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const items = [];

    // Process all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Group text items by their vertical position (y coordinate)
      const lineMap = new Map();
      textContent.items.forEach(item => {
        const y = Math.round(item.transform[5]); // Get y coordinate
        if (!lineMap.has(y)) {
          lineMap.set(y, []);
        }
        lineMap.get(y).push({
          text: item.str,
          x: item.transform[4] // Store x coordinate
        });
      });

      // Sort lines by y coordinate (top to bottom) and combine items in each line
      const lines = Array.from(lineMap.entries())
        .sort((a, b) => b[0] - a[0]) // Sort by y coordinate
        .map(([_, items]) => {
          // Sort items by x coordinate and join
          return items
            .sort((a, b) => a.x - b.x)
            .map(item => item.text)
            .join(' ')
            .trim();
        })
        .filter(line => line.length > 0);

      console.log(`Extracted lines from page ${pageNum}:`, lines); // Debug log

      // Process each line looking for World Famous items
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        console.log(`Processing line ${i}:`, JSON.stringify(line)); // Debug log
        
        // Skip header lines or lines that don't contain item information
        if (!line || 
            line.includes('Qty Fulfilled') || 
            line.includes('Page') || 
            line.includes('Total') || 
            line.includes('Subtotal') ||
            line.includes('Order Information') ||
            line.includes('Sales Order')) {
          continue;
        }

        // Look for quantity line pattern (e.g., "0 0 10 $9.25 $92.50")
        const quantityMatch = line.match(/(\d+)\s+\d+\s+(\d+)\s+\$[\d,.]+\s+\$[\d,.]+/);
        if (quantityMatch) {
          const [_, fulfilled, quantity] = quantityMatch;
          console.log(`Found quantity line - Fulfilled: ${fulfilled}, Quantity: ${quantity}`); // Debug log
          
          // Look ahead for the item code in the next few lines
          for (let j = 1; j <= 3; j++) {
            if (i + j >= lines.length) break;
            
            const nextLine = lines[i + j].trim();
            // Match both World Famous (WF) and Kuro Sumi (KS) items
            const itemCodeMatch = nextLine.match(/(WF|KS)[A-Z0-9]+(?:\/\d+)?/);
            
            if (itemCodeMatch) {
              const itemCode = itemCodeMatch[0];
              console.log(`Found item code: ${itemCode}`); // Debug log

              // Combine the next few lines to get the full color description first
              let color = '';
              let descriptionLines = [];
              for (let k = 0; k < 3; k++) {
                if (i + j + k >= lines.length) break;
                const colorLine = lines[i + j + k].trim();
                if (colorLine && 
                    !colorLine.match(/(WF|KS)[A-Z0-9]+(?:\/\d+)?/) && 
                    !colorLine.match(/\d+\s+\d+\s+\d+\s+\$[\d,.]+\s+\$[\d,.]+/)) {
                  descriptionLines.push(colorLine);
                }
              }
              color = descriptionLines.join(' ');
              console.log(`Raw color description: ${color}`); // Debug log

              // Extract size from the description or item code
              let size = '1oz';
              if (itemCode.includes('1/2')) {
                size = '1/2oz';
              } else if (itemCode.match(/[24]$/)) {
                size = `${itemCode.slice(-1)}oz`;
              } else {
                const sizeMatch = color.match(/(\d+(?:\.\d+)?)\s*(?:\/\s*\d+)?\s*oz/);
                if (sizeMatch) {
                  if (sizeMatch[0].includes('1/2')) {
                    size = '1/2oz';
                  } else {
                    size = `${sizeMatch[1]}oz`;
                  }
                }
              }

              // Special case for Kuro Sumi sizes
              if (itemCode.startsWith('KS')) {
                if (itemCode.includes('OL6') || itemCode.includes('G6')) {
                  size = '6oz';
                } else if (itemCode.includes('OI12')) {
                  size = '12oz';
                } else if (itemCode.includes('SW3')) {
                  size = '3oz';
                } else if (itemCode.includes('SW1.5')) {
                  size = '1.5oz';
                }
              }

              // Clean up the color name
              color = color
                .replace(itemCode, '')
                .replace(/\$[\d,.]+/g, '') // Remove price information
                .replace(/\d+\s*oz/g, '') // Remove size information first
                .replace(/\d+\s*\/\s*\d+\s*oz/g, '') // Remove fractional sizes
                .replace(/\d+\s+of\s+\d+/g, '') // Remove page numbers
                .replace(/\d+\s*\/\s*$/g, '') // Remove trailing fractions
                .replace(/[-—]/g, ' ')
                .replace(/Tattoo Ink/g, '')
                .replace(/Ink/g, '')
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .trim();

              // Special case handling for color names
              if (itemCode.startsWith('WFADPP')) {
                const num = itemCode.match(/(\d+)/)?.[1] || '';
                color = `Pancho Pastel #${num}`;
              } else if (itemCode.startsWith('WFMHS')) {
                // Keep the full Must-Haves set name
                const bottleMatch = color.match(/(\d+)\s*Bottle/);
                const bottleCount = bottleMatch ? bottleMatch[1] : '12';
                color = `World Famous Must-Haves ${bottleCount} Bottle Ink Set`;
              } else if (itemCode.startsWith('WFSTSS')) {
                color = 'Santucci Skintone Set';
              } else if (itemCode.startsWith('KS')) {
                // Handle Kuro Sumi items
                if (itemCode === 'KSZP') {
                  const bottleMatch = color.match(/(\d+)\s*Bottle/);
                  const bottleCount = bottleMatch ? bottleMatch[1] : '4';
                  color = `Kuro Sumi ${bottleCount} Bottle Zhang Po Shading Set`;
                } else if (itemCode.startsWith('KSOL') || itemCode.startsWith('KSOI')) {
                  color = 'Kuro Sumi Outlining';
                } else if (itemCode === 'KSG6') {
                  color = 'Kuro Sumi Greywash';
                } else if (itemCode.startsWith('KSSW')) {
                  color = 'Kuro Sumi Samurai White';
                } else {
                  // For other Kuro Sumi items
                  color = color
                    .replace(/Kuro Sumi/g, '')
                    .replace(/World Famous/g, '')
                    .trim();
                  color = `Kuro Sumi ${color}`;
                }
              } else {
                // For regular World Famous items
                color = color
                  .replace(/World Famous/g, '')
                  .trim();
              }

              if (color.match(/Mid[- ]tone/i) || color.match(/Mid[- ]Tone/i)) {
                color = 'Mid-tone Greywash';
              } else if (!color) {
                color = getColorFromItemCode(itemCode);
              }

              // Clean up any remaining multiple spaces and trailing characters
              color = color
                .replace(/\s+/g, ' ')
                .replace(/[,\s]+$/, '') // Remove trailing commas and spaces
                .replace(/\s*—\s*$/, '') // Remove trailing dashes
                .trim();

              // Remove any remaining numbers at the end of color names
              color = color.replace(/\s+\d+\s*$/, '');

              const parsedItem = {
                itemCode,
                color,
                size,
                quantity: parseInt(quantity)
              };
              console.log("Parsed item:", JSON.stringify(parsedItem)); // Debug log

              if (itemCode && parseInt(quantity) > 0) {
                items.push(parsedItem);
              }
              break;
            }
          }
        }
      }
    }

    if (items.length === 0) {
      console.log("No items found in any page"); // Debug log
      throw new Error('No valid items found in the invoice');
    }

    // No sorting - preserve invoice order
    return items;
  } catch (error) {
    console.error('Error parsing World Famous PDF:', error);
    throw error;
  }
};

function getColorFromItemCode(itemCode) {
  // Special cases for specific product lines
  if (itemCode.startsWith('WFFMW')) {
    return 'Mt. Fuji Mixing White';
  }
  if (itemCode.startsWith('WFPW')) {
    return 'Portrait White';
  }
  if (itemCode.startsWith('WFMDGW')) {
    return 'Mid-tone Greywash';
  }
  if (itemCode.startsWith('WFMTGW')) {
    return 'Mid-tone Greywash';
  }
  if (itemCode.startsWith('WFADPP')) {
    const num = itemCode.match(/\d+/)?.[0] || '';
    return `Pancho Pastel #${num}`;
  }
  if (itemCode.startsWith('WFP2H')) {
    return 'Poch 2H';
  }
  if (itemCode.startsWith('WFMHS')) {
    return 'World Famous Must-Haves 12 Bottle Ink Set';
  }
  if (itemCode.startsWith('WFILL')) {
    return 'Illuminati Yellow';
  }
  if (itemCode.startsWith('WFLGW')) {
    return 'Light Greywash';
  }
  if (itemCode.startsWith('WFDGW')) {
    return 'Dark Greywash';
  }
  if (itemCode.startsWith('WFBW')) {
    return 'Blackwash';
  }
  if (itemCode.startsWith('WFMW')) {
    return 'Mixing White';
  }
  if (itemCode.startsWith('WFLW')) {
    return 'Lining White';
  }
  if (itemCode.startsWith('WFHW')) {
    return 'High White';
  }
  if (itemCode.startsWith('WFBB')) {
    return 'Blue Black';
  }
  if (itemCode.startsWith('WFPB')) {
    return 'Pure Black';
  }
  if (itemCode.startsWith('WFGB')) {
    return 'Golden Black';
  }
  if (itemCode.startsWith('WFDB')) {
    return 'Dark Black';
  }
  if (itemCode.startsWith('WFXB')) {
    return 'Extreme Black';
  }
  if (itemCode.startsWith('WFUB')) {
    return 'Ultimate Black';
  }
  if (itemCode.startsWith('WFMKSK')) {
    return 'Maks Skintone';
  }
  if (itemCode.startsWith('WFSTSS')) {
    return 'Saniderm Skintone Set';
  }
  if (itemCode.startsWith('KS')) {
    // Handle Kuro Sumi items
    const code = itemCode.replace('KS', '');
    if (code === 'ZP') return 'Zhang Po Shading Set';
    if (code === 'OL6') return 'Outlining';
    if (code === 'OI12') return 'Outlining';
    if (code === 'G6') return 'Greywash';
    if (code === 'SW3') return 'Samurai White';
    if (code === 'SW1.5') return 'Samurai White';
  }
  
  // If no specific match, try to extract a meaningful name from the code
  const code = itemCode.replace(/^(WF|KS)/, '').split(/\d+/)[0];
  const words = code.split(/(?=[A-Z])/).filter(word => word.length > 0);
  return words.join(' ');
}

const parseItem = (itemText) => {
  const lines = itemText.split('\n');
  const itemCodeMatch = lines[0].match(/Item Code:\s*([^\s]+)/);
  const colorMatch = lines[0].match(/Color:\s*([^\n]+)/);
  const sizeMatch = lines[0].match(/Size:\s*([^\n]+)/);
  const quantityMatch = lines[0].match(/Quantity:\s*(\d+)/);

  if (!itemCodeMatch || !colorMatch || !sizeMatch || !quantityMatch) {
    return null;
  }

  return {
    itemCode: itemCodeMatch[1].trim(),
    color: colorMatch[1].trim(),
    size: sizeMatch[1].trim(),
    quantity: parseInt(quantityMatch[1]),
  };
};
