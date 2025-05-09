// src/components/ImportPreview.js
import React from "react";

function ImportPreview({ importData }) {
  if (importData.length === 0) {
    return <p>No import data.</p>;
  }
  return (
    <div>
      <h3>Import Preview</h3>
      <table>
        <thead>
          <tr>
            <th>Item Code</th>
            <th>Color</th>
            <th>Quantity</th>
            <th>Size</th>
          </tr>
        </thead>
        <tbody>
          {importData.map((item, i) => (
            <tr key={i}>
              <td>{item.itemCode}</td>
              <td>{item.color}</td>
              <td>{item.quantity}</td>
              <td>{item.size}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ImportPreview;
