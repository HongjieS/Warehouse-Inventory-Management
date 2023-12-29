import React, { useState } from "react";
import * as XLSX from "xlsx";
import "./styles.css";

function App() {
  const [currentBrand, setCurrentBrand] = useState("World Famous");
  const [worldFamousStock, setWorldFamousStock] = useState([]);
  const [eternalStock, setEternalStock] = useState([]);
  const [importData, setImportData] = useState([]);
  const [file, setFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentView, setCurrentView] = useState("Stock");
  const [tempChanges, setTempChanges] = useState({});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Function to handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleImport = () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const workbook = XLSX.read(e.target.result, { type: "binary" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        // Process the data from Excel
        const processedData = jsonData.slice(2).map((row) => ({
          description: row[1] || "",
          quantity: row[2] ? row[2] : 0,
        }));

        // Calculate total quantity added
        const totalQuantityAdded = processedData.reduce(
          (total, item) => total + (item.quantity || 0),
          0
        );

        // Add history entry for import action
        updateHistory("Import Excel", {
          filename: file.name,
          totalQuantityAdded,
        });

        setImportData(processedData); // Assuming this is needed for other logic
      };
      reader.readAsBinaryString(file);
    }
  };

  const downloadImportedFile = () => {
    if (file) {
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up to avoid memory leaks
    }
  };

  const confirmImport = () => {
    const updateStock = (currentStock) => {
      let updatedStock = [...currentStock];

      importData.forEach((importedItem) => {
        const description = importedItem.description; // Adjust based on your data structure
        const quantityToAdd = importedItem.quantity;

        const itemIndex = updatedStock.findIndex(
          (stockItem) => stockItem.description === description
        );
        if (itemIndex >= 0) {
          // Update existing item's quantity
          updatedStock[itemIndex] = {
            ...updatedStock[itemIndex],
            quantity: updatedStock[itemIndex].quantity + quantityToAdd,
          };
        } else {
          // Add new item
          updatedStock.push({ description, quantity: quantityToAdd });
        }
      });

      return updatedStock;
    };

    if (currentBrand === "World Famous") {
      setWorldFamousStock((prevStock) => updateStock(prevStock));
    } else {
      setEternalStock((prevStock) => updateStock(prevStock));
    }

    setImportData([]); // Clear the import data after updating
  };

  const getCurrentStock = () => {
    const currentStock =
      currentBrand === "World Famous" ? worldFamousStock : eternalStock;

    return currentStock.filter((item) => {
      const description = item.description || "";
      const matchesSearchQuery = description
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesSize = selectedSize
        ? description.includes(selectedSize)
        : true;
      const quantity = Number(item.quantity) || 0;
      const isInStock = !showInStockOnly || quantity > 0;

      return matchesSearchQuery && matchesSize && isInStock;
    });
  };

  const totalBottles = getCurrentStock().reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const handleStockChange = (index, field, value) => {
    const updatedStock =
      currentBrand === "World Famous"
        ? [...worldFamousStock]
        : [...eternalStock];
    updatedStock[index][field] = value;

    if (field === "quantity") {
      const stockItem =
        currentBrand === "World Famous"
          ? worldFamousStock[index]
          : eternalStock[index];
      setTempChanges((prevChanges) => ({
        ...prevChanges,
        [stockItem.description]: {
          ...prevChanges[stockItem.description],
          changedQuantity:
            Number(value) -
            (prevChanges[stockItem.description].originalQuantity || 0),
        },
      }));
    }

    if (currentBrand === "World Famous") {
      setWorldFamousStock(updatedStock);
    } else {
      setEternalStock(updatedStock);
    }
  };

  const addNewItem = () => {
    const newItem = { description: "", quantity: 0 };
    updateHistory("Add New Item", { description: "", quantity: 0 });
    if (currentBrand === "World Famous") {
      setWorldFamousStock([...worldFamousStock, newItem]);
    } else {
      setEternalStock([...eternalStock, newItem]);
    }
  };

  const enterEditMode = () => {
    setIsEditMode(true);
    const initialStock =
      currentBrand === "World Famous" ? worldFamousStock : eternalStock;
    setTempChanges(
      initialStock.reduce((acc, item) => {
        acc[item.description] = { originalQuantity: item.quantity };
        return acc;
      }, {})
    );
  };

  const finalizeEditing = () => {
    setIsEditMode(false);

    const bulkEditDetails = Object.entries(tempChanges).reduce(
      (acc, [description, { changedQuantity }]) => {
        if (changedQuantity && changedQuantity !== 0) {
          acc[description] = changedQuantity;
        }
        return acc;
      },
      {}
    );

    if (Object.keys(bulkEditDetails).length > 0) {
      updateHistory("Bulk Edit", bulkEditDetails);
    }

    setTempChanges({});
  };

  const handleExport = () => {
    // Make a deep copy of the current stock to work with
    const updatedStock =
      currentBrand === "World Famous"
        ? [...worldFamousStock]
        : [...eternalStock];

    // Track whether all items have sufficient stock for export
    let allItemsHaveSufficientStock = true;

    // Check if there's enough stock for the items to be exported
    importData.forEach((importItem) => {
      const stockIndex = updatedStock.findIndex(
        (item) => item.description === importItem.description
      );

      if (stockIndex !== -1) {
        const currentStockItem = updatedStock[stockIndex];

        // Check if there's enough stock
        if (currentStockItem.quantity >= importItem.quantity) {
          // Subtract the quantity to be exported from the current stock
          updatedStock[stockIndex] = {
            ...currentStockItem,
            quantity: currentStockItem.quantity - importItem.quantity,
          };
        } else {
          allItemsHaveSufficientStock = false;
          alert(`Not enough stock for item: ${importItem.description}`);
        }
      } else {
        allItemsHaveSufficientStock = false;
        alert(`Item not found in stock: ${importItem.description}`);
      }
    });

    // If all items have sufficient stock, update the state
    if (allItemsHaveSufficientStock) {
      if (currentBrand === "World Famous") {
        setWorldFamousStock(updatedStock);
      } else {
        setEternalStock(updatedStock);
      }

      // Optionally clear the importData or handle it accordingly
      // setImportData([]);

      // Optionally, add a history entry for the export action
      addToHistory("Export", importData);

      // Alert the user that the export was successful
      alert("Export successful. Stock has been updated.");
    }
  };

  const exportSelectedHistoryToTextFile = () => {
    history
      .filter((entry) => entry.selected)
      .forEach((entry) => {
        if (entry.actionType === "Import Excel") {
          // If the entry is an import action, download the original Excel file
          downloadImportedFile();
        } else {
          // For other types of history entries, handle them here
          // This could involve exporting a summary or details in a text format
          // Example:
          const historyText = `${entry.date} - ${
            entry.actionType
          }: ${JSON.stringify(entry.details)}`;
          const blob = new Blob([historyText], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${entry.actionType}_history.txt`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      });
  };

  const addToHistory = (actionType, details) => {
    const newEntry = {
      date: new Date().toLocaleString(),
      actionType,
      details,
    };
    setHistory((prevHistory) => [...prevHistory, newEntry]);
  };

  const updateHistory = (actionType, details) => {
    const newHistoryEntry = {
      date: new Date().toLocaleString(),
      actionType,
      brand: currentBrand, // Add the current brand
      details,
      selected: false,
    };
    setHistory((prevHistory) => [...prevHistory, newHistoryEntry]);
  };

  const toggleHistorySelection = (index) => {
    setHistory(
      history.map((entry, i) => {
        if (i === index) {
          return { ...entry, selected: !entry.selected };
        }
        return entry;
      })
    );
  };

  const getTotalQuantityChange = (details) => {
    // Assuming details is an object with structure: { description: changeQuantity, ... }
    return Object.values(details).reduce(
      (total, change) => total + Math.abs(change),
      0
    );
  };

  const formatBulkEditDetails = (details) => {
    return Object.entries(details)
      .map(
        ([description, quantityChange]) =>
          `${description}: ${quantityChange > 0 ? "+" : ""}${quantityChange}`
      )
      .join(", ");
  };

  const deleteItem = (index) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this item?"
    );
    if (!isConfirmed) return;

    const stock =
      currentBrand === "World Famous" ? worldFamousStock : eternalStock;
    const deletedItem = stock[index];

    if (currentBrand === "World Famous") {
      setWorldFamousStock(stock.filter((_, i) => i !== index));
    } else if (currentBrand === "Eternal") {
      setEternalStock(stock.filter((_, i) => i !== index));
    }

    updateHistory("Delete Item", { deletedItem: deletedItem.description });
  };

  return (
    <div className="App">
      <div className="top-bar">
        <h1>Warehouse Inventory</h1>
      </div>

      {/* Sidebar content */}
      <div className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <button onClick={() => setCurrentBrand("World Famous")}>
          World Famous
        </button>
        <button onClick={() => setCurrentBrand("Eternal")}>Eternal</button>
      </div>

      {/* Main Content Area */}
      <div className={`main-content ${isSidebarCollapsed ? "expanded" : ""}`}>
        {/* Action Buttons */}
        <div className="action-buttons">
          {isEditMode ? (
            <button onClick={finalizeEditing}>Finish Editing</button>
          ) : (
            <button onClick={enterEditMode}>Edit Stock</button>
          )}
          <button onClick={() => setCurrentView("History")}>History</button>
          <input type="file" onChange={handleFileChange} accept=".xlsx, .xls" />
          <button onClick={handleImport}>Preview File</button>
          <button onClick={confirmImport}>Confirm Import</button>
          {/* Export Button */}
          <button className="export-button" onClick={handleExport}>
            Confirm Export
          </button>
        </div>

        {/* Size Filter and Total Bottles Display */}
        <div className="filter-section">
          <div className="size-filter">
            <select
              onChange={(e) => setSelectedSize(e.target.value)}
              value={selectedSize}
            >
              <option value="">All Sizes</option>
              <option value="1/2oz">1/2oz</option>
              <option value="1oz">1oz</option>
              <option value="4oz">4oz</option>
              <option value="8oz">8oz</option>
            </select>
          </div>
          <div className="total-bottles">
            <h3>
              Total Bottles:{" "}
              {getCurrentStock().reduce((sum, item) => sum + item.quantity, 0)}
            </h3>
          </div>
        </div>

        {/* Conditional Rendering Based on View */}
        {currentView === "History" ? (
          <div>
            <button onClick={() => setCurrentView("Stock")}>
              View Current Stock
            </button>
            <h3>Change History</h3>
            <table>
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Date and Time</th>
                  <th>Brand</th> {/* New header for brand */}
                  <th>Action Type</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {history.map((entry, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="checkbox"
                        checked={entry.selected}
                        onChange={() => toggleHistorySelection(index)}
                      />
                    </td>
                    <td>{entry.date}</td>
                    <td>{entry.brand}</td> {/* Display the brand */}
                    <td>{entry.actionType}</td>
                    <td>
                      {entry.actionType === "Import Excel"
                        ? entry.details.totalQuantityAdded
                        : entry.actionType === "Bulk Edit"
                        ? getTotalQuantityChange(entry.details)
                        : JSON.stringify(entry.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={exportSelectedHistoryToTextFile}>
              Export Selected History
            </button>
          </div>
        ) : (
          <>
            {/* Current Stock Section Header */}
            <div className="stock-header">
              <h3>Current Stock ({currentBrand})</h3>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
              />
              <label>
                <input
                  type="checkbox"
                  checked={showInStockOnly}
                  onChange={(e) => setShowInStockOnly(e.target.checked)}
                />
                Show In-Stock Only
              </label>
              <div className="total-bottles">
                Total Bottles:{" "}
                {getCurrentStock().reduce(
                  (sum, item) => sum + item.quantity,
                  0
                )}
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {getCurrentStock().map((item, index) => (
                    <tr key={index}>
                      <td>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              handleStockChange(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                          />
                        ) : (
                          item.description
                        )}
                      </td>
                      <td>
                        {isEditMode ? (
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleStockChange(
                                index,
                                "quantity",
                                Number(e.target.value)
                              )
                            }
                          />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      {isEditMode && (
                        <td>
                          <button onClick={() => deleteItem(index)}>
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {isEditMode && <button onClick={addNewItem}>Add New Item</button>}
            </div>

            {/* Import Preview Table */}
            <div>
              <h3>Import Preview</h3>
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.description}</td>
                      <td>{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
