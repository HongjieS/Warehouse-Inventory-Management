// src/components/StockTable.js
import React from "react";

function StockTable({
  stockItems,
  isEditMode,
  onChangeItem,
  onDeleteItem
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>Color</th>
          <th>Quantity</th>
          <th>Size</th>
          {isEditMode && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {stockItems.map((item, index) => (
          <tr key={index}>
            <td>
              {isEditMode ? (
                <input
                  type="text"
                  value={item.color}
                  onChange={(e) => onChangeItem(index, "color", e.target.value)}
                />
              ) : (
                item.color
              )}
            </td>
            <td>
              {isEditMode ? (
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    onChangeItem(index, "quantity", Number(e.target.value))
                  }
                />
              ) : (
                item.quantity
              )}
            </td>
            <td>
              {isEditMode ? (
                <input
                  type="text"
                  value={item.size}
                  onChange={(e) => onChangeItem(index, "size", e.target.value)}
                />
              ) : (
                item.size
              )}
            </td>
            {isEditMode && (
              <td>
                <button onClick={() => onDeleteItem(index)}>Delete</button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default StockTable;
