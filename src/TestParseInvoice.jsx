import React, { useState, useEffect } from 'react';
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.entry";
import { Button, Box, Typography, Paper, CircularProgress } from '@mui/material';

// Ensure worker is properly configured
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const TestParseInvoice = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setResults([]);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      addResult(`PDF has ${pdf.numPages} pages`);

      // Process each page
      let allText = "";
      let linesByPage = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        addResult(`Page ${i} has ${textContent.items.length} text items`);
        
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

        addResult(`Page ${i} has ${lines.length} reconstructed lines`);
        linesByPage.push(lines);
        allText += lines.join('\n') + '\n';
      }

      // Look for specific patterns that could be items
      addResult("\nSearching for item entries using regex patterns...");
      
      // Find SI- item codes
      const itemCodes = allText.match(/\bSI-\d+\b/gi);
      if (itemCodes && itemCodes.length > 0) {
        addResult(`Found ${itemCodes.length} potential item codes: ${itemCodes.join(', ')}`);
      } else {
        addResult("No item codes found with pattern SI-XXXX");
      }
      
      // Look for lines with dollar amounts that might be products
      const priceLines = allText.split('\n')
        .filter(line => line.includes('$'))
        .filter(line => !line.includes('Total') && !line.includes('Subtotal'));
      
      addResult(`Found ${priceLines.length} lines with dollar amounts that might be products:`);
      priceLines.forEach((line, i) => {
        addResult(`Product line ${i}: ${line}`);
      });
      
      // Show all lines from each page for detailed analysis
      linesByPage.forEach((lines, pageIndex) => {
        addResult(`\nAll lines from page ${pageIndex + 1}:`);
        lines.forEach((line, lineIndex) => {
          addResult(`Line ${lineIndex}: ${line}`);
        });
      });
      
      // Now let's specifically try to extract items using the most likely pattern
      addResult("\nAttempting to extract items...");
      
      const extractedItems = [];
      
      // Based on the observed patterns, we'll try several approaches:
      for (let pageIndex = 0; pageIndex < linesByPage.length; pageIndex++) {
        const lines = linesByPage[pageIndex];
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Look for a line that contains both SI- and $ 
          if (line.match(/SI-\d+/i) && line.includes('$')) {
            // Try to parse this line
            // Format might be: SI-XXXX Description QTY $Price $Total
            const itemCode = line.match(/SI-\d+/i)[0];
            let parts = line.split(/\s+/);
            let itemCodeIndex = -1;
            
            // Find the position of the item code in the parts array
            for (let j = 0; j < parts.length; j++) {
              if (parts[j].toUpperCase() === itemCode.toUpperCase()) {
                itemCodeIndex = j;
                break;
              }
            }
            
            if (itemCodeIndex >= 0) {
              // Find the first $ sign after the item code
              let firstDollarIndex = -1;
              for (let j = itemCodeIndex + 1; j < parts.length; j++) {
                if (parts[j].startsWith('$')) {
                  firstDollarIndex = j;
                  break;
                }
              }
              
              // The part just before the first $ might be the quantity
              let quantity = 1;
              let description = '';
              
              if (firstDollarIndex > itemCodeIndex + 1) {
                // Check if the part before the $ is a number (quantity)
                const qtyCandidate = parts[firstDollarIndex - 1];
                if (/^\d+$/.test(qtyCandidate)) {
                  quantity = parseInt(qtyCandidate, 10);
                  
                  // Description is everything between item code and quantity
                  if (firstDollarIndex - 2 > itemCodeIndex) {
                    description = parts.slice(itemCodeIndex + 1, firstDollarIndex - 1).join(' ');
                  }
                } else {
                  // If the part before $ is not a number, include it in the description
                  description = parts.slice(itemCodeIndex + 1, firstDollarIndex).join(' ');
                }
              }
              
              extractedItems.push({
                itemCode,
                description,
                quantity,
                line
              });
            }
          }
        }
      }
      
      if (extractedItems.length > 0) {
        addResult(`Successfully extracted ${extractedItems.length} items:`);
        extractedItems.forEach((item, index) => {
          addResult(`Item ${index + 1}:`);
          addResult(`  Item Code: ${item.itemCode}`);
          addResult(`  Description: ${item.description}`);
          addResult(`  Quantity: ${item.quantity}`);
          addResult(`  Original Line: ${item.line}`);
        });
      } else {
        addResult("Could not extract any items using direct parsing methods.");
      }
      
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  function addResult(text) {
    setResults(prev => [...prev, text]);
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        PDF Invoice Parser Test
      </Typography>
      
      <Button 
        variant="contained" 
        component="label"
        disabled={loading}
        sx={{ mb: 3 }}
      >
        Select Invoice PDF
        <input
          type="file"
          accept=".pdf"
          hidden
          onChange={handleFileSelect}
        />
      </Button>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Typography color="error" sx={{ my: 2 }}>
          Error: {error}
        </Typography>
      )}
      
      {results.length > 0 && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            mt: 2, 
            bgcolor: '#f5f5f5', 
            fontFamily: 'monospace',
            maxHeight: '600px',
            overflow: 'auto'
          }}
        >
          <pre>
            {results.join('\n')}
          </pre>
        </Paper>
      )}
    </Box>
  );
};

export default TestParseInvoice; 