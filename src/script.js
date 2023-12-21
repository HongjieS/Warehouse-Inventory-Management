document.addEventListener('DOMContentLoaded', function() {
    // Attach event listener to the Import button
    document.querySelector('.import-export-btn[data-action="import"]').addEventListener('click', handleImport);

    // Attach event listener to the search input
    document.getElementById('search-input').addEventListener('input', searchTable);
});

function handleImport() {
    var fileInput = document.getElementById('excelFile');
    var file = fileInput.files[0];
    if (file) {
        readExcelFile(file);
    } else {
        alert('Please select a file to import.');
    }
}

function readExcelFile(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert the worksheet to JSON
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        displayData(json);
    };
    reader.readAsBinaryString(file);
}

function displayData(data) {
    let table = document.createElement('table');
    table.id = 'data-table';

    let thead = table.createTHead();
    let headerRow = thead.insertRow();

    // Define the headers you want to display
   

    headers.forEach(headerText => {
        let th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    let tbody = table.createTBody();
    for (let i = 1; i < data.length; i++) {
        let row = data[i];
        let tr = tbody.insertRow();

        // Assuming Description is in column B (index 1) and Quantity is in column C (index 2)
        let descriptionCell = document.createElement('td');
        let quantityCell = document.createElement('td');

        // Adjust the column indices to match your data structure
        descriptionCell.textContent = row[1] || '';
        quantityCell.textContent = row[2] || '';

        tr.appendChild(descriptionCell);
        tr.appendChild(quantityCell);
    }

    const container = document.getElementById('data-container');
    container.innerHTML = '';
    container.appendChild(table);
}






function searchTable(event) {
    let query = event.target.value.toLowerCase();
    let table = document.getElementById('data-table');
    let rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) {
        let row = rows[i];
        let cells = row.getElementsByTagName('td');
        let found = false;

        for (let j = 0; j < cells.length; j++) {
            let cell = cells[j];
            if (cell.textContent.toLowerCase().includes(query)) {
                found = true;
                break;
            }
        }

        if (found) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
}
