
const Papa = require('f:/Bioplast/node_modules/papaparse');
const fs = require('fs');

const fileContent = fs.readFileSync('f:/Bioplast/productoscliente.csv', 'utf8');

Papa.parse(fileContent, {
  header: true,
  skipEmptyLines: 'greedy',
  complete: (results) => {
    let rows = results.data;
    console.log("--- DEBUG RAW ---");
    console.log("Keys:", Object.keys(rows[0]));
    console.log("Delimiter:", results.meta.delimiter);

    // --- LÓGICA DE RESCATE (PLAN B v3) ---
    const isSingleKeyFailure = (row) => {
      if (!row) return false;
      const keys = Object.keys(row).filter(k => k !== '__parsed_extra');
      return keys.length === 1 && keys[0].includes(';');
    };

    if (rows.length > 0 && isSingleKeyFailure(rows[0])) {
      console.log("ACTUALIZANDO: Auto-reparando archivo...");
      const keys = Object.keys(rows[0]).filter(k => k !== '__parsed_extra');
      const rawHeaders = keys[0].split(';');
      
      rows = rows.map(row => {
        let fullRowString = String(Object.values(row).filter((_, i) => Object.keys(row)[i] !== '__parsed_extra')[0]);
        if (row.__parsed_extra && Array.isArray(row.__parsed_extra)) {
          fullRowString += ';' + row.__parsed_extra.join(';');
        }
        const rawValues = fullRowString.split(';');
        const newRow = {};
        rawHeaders.forEach((h, i) => {
          newRow[h] = rawValues[i] || '';
        });
        return newRow;
      });
    }

    console.log("--- FINAL ROWS ---");
    console.log("Count:", rows.length);
    console.log("First Row Name:", rows[0].nombre || rows[0].Nombre);
    console.log("Data sample:", rows[0]);
  }
});
