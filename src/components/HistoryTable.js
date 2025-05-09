// src/components/HistoryTable.js
import React from "react";

function HistoryTable({ history, onToggleSelect }) {
  return (
    <div>
      <h3>Change History</h3>
      <table>
        <thead>
          <tr>
            <th>Select</th>
            <th>Date/Time</th>
            <th>Brand</th>
            <th>Action</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry, i) => (
            <tr key={i}>
              <td>
                <input
                  type="checkbox"
                  checked={entry.selected}
                  onChange={() => onToggleSelect(i)}
                />
              </td>
              <td>{entry.date}</td>
              <td>{entry.brand}</td>
              <td>{entry.actionType}</td>
              <td>{JSON.stringify(entry.details)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default HistoryTable;
