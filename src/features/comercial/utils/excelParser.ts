import JSZip from 'jszip';

export interface ParsedSheetData {
  sheetName: string;
  headers: string[];
  rows: Record<string, string>[];
  rawRows: string[][];
}

/**
 * Convierte letras de columna de Excel (A, B, Z, AA, etc.) a índice numérico 0-based
 */
function colLetterToIndex(col: string): number {
  let index = 0;
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.charCodeAt(i) - 64);
  }
  return index - 1;
}

/**
 * Parsea un archivo .csv o .tsv
 */
export function parseCsvText(text: string): ParsedSheetData {
  // Detectar delimitador: coma, punto y coma o tab
  const firstLine = text.split(/\r?\n/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let delimiter = ',';
  if (semicolonCount > commaCount && semicolonCount > tabCount) {
    delimiter = ';';
  } else if (tabCount > commaCount && tabCount > semicolonCount) {
    delimiter = '\t';
  }

  // Regex para dividir respetando comillas
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const rawRows: string[][] = [];

  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // escapar comilla doble
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rawRows.push(row);
  }

  if (rawRows.length === 0) {
    return { sheetName: 'Datos', headers: [], rows: [], rawRows: [] };
  }

  const headers = rawRows[0].map((h, i) => h || `Columna ${i + 1}`);
  const dataRows = rawRows.slice(1).map(r => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = r[i] !== undefined ? r[i] : '';
    });
    return obj;
  });

  return {
    sheetName: 'Datos',
    headers,
    rows: dataRows,
    rawRows: rawRows.slice(1)
  };
}

/**
 * Parsea un archivo Excel .xlsx usando JSZip nativo
 */
export async function parseXlsxFile(file: File): Promise<ParsedSheetData[]> {
  const isCsv = file.name.endsWith('.csv') || file.name.endsWith('.tsv') || file.name.endsWith('.txt');
  if (isCsv) {
    const text = await file.text();
    return [parseCsvText(text)];
  }

  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Extraer sharedStrings.xml si existe
  const sharedStrings: string[] = [];
  const sharedStringsFile = zip.file('xl/sharedStrings.xml');
  if (sharedStringsFile) {
    const ssXmlText = await sharedStringsFile.async('text');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(ssXmlText, 'application/xml');
    const siElements = xmlDoc.getElementsByTagName('si');

    for (let i = 0; i < siElements.length; i++) {
      const si = siElements[i];
      const tElements = si.getElementsByTagName('t');
      let text = '';
      for (let j = 0; j < tElements.length; j++) {
        text += tElements[j].textContent || '';
      }
      sharedStrings.push(text);
    }
  }

  // 2. Extraer hojas de cálculo
  const sheets: ParsedSheetData[] = [];
  // Buscar archivos de hojas de cálculo
  const sheetFiles = Object.keys(zip.files).filter(path => /^xl\/worksheets\/sheet\d+\.xml$/i.test(path));

  for (const sheetPath of sheetFiles) {
    const sheetFile = zip.file(sheetPath);
    if (!sheetFile) continue;

    const sheetXmlText = await sheetFile.async('text');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(sheetXmlText, 'application/xml');

    const rowElements = xmlDoc.getElementsByTagName('row');
    const rawRowsMap: Map<number, string[]> = new Map();
    let maxCol = 0;

    for (let rIdx = 0; rIdx < rowElements.length; rIdx++) {
      const rowEl = rowElements[rIdx];
      const rowNum = parseInt(rowEl.getAttribute('r') || String(rIdx + 1), 10);
      const cells = rowEl.getElementsByTagName('c');
      const rowData: string[] = [];

      for (let cIdx = 0; cIdx < cells.length; cIdx++) {
        const cell = cells[cIdx];
        const cellRef = cell.getAttribute('r') || ''; // ej: A1, B2
        const cellType = cell.getAttribute('t'); // 's' para shared string

        // Extraer índice de columna a partir del cellRef
        const colLetters = cellRef.replace(/[0-9]/g, '');
        const colIdx = colLetters ? colLetterToIndex(colLetters) : cIdx;

        let cellValue = '';
        const vEl = cell.getElementsByTagName('v')[0];
        const isEl = cell.getElementsByTagName('is')[0];

        if (cellType === 's' && vEl) {
          const strIdx = parseInt(vEl.textContent || '0', 10);
          cellValue = sharedStrings[strIdx] || '';
        } else if (cellType === 'inlineStr' && isEl) {
          const tEl = isEl.getElementsByTagName('t')[0];
          cellValue = tEl?.textContent || '';
        } else if (vEl) {
          cellValue = vEl.textContent || '';
        }

        while (rowData.length < colIdx) {
          rowData.push('');
        }
        rowData[colIdx] = cellValue.trim();
        if (colIdx > maxCol) maxCol = colIdx;
      }

      rawRowsMap.set(rowNum, rowData);
    }

    // Convertir mapa a lista secuencial
    const sortedRowNums = Array.from(rawRowsMap.keys()).sort((a, b) => a - b);
    const allRows: string[][] = [];

    for (const rNum of sortedRowNums) {
      const row = rawRowsMap.get(rNum) || [];
      // Asegurar que la fila tenga columnas suficientes
      while (row.length <= maxCol) {
        row.push('');
      }
      if (row.some(c => c !== '')) {
        allRows.push(row);
      }
    }

    if (allRows.length > 0) {
      const headers = allRows[0].map((h, i) => h.trim() || `Columna ${i + 1}`);
      const dataRows = allRows.slice(1).map(r => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = r[i] !== undefined ? r[i] : '';
        });
        return obj;
      });

      const sheetNum = sheetPath.match(/\d+/)?.[0] || '1';
      sheets.push({
        sheetName: `Hoja ${sheetNum}`,
        headers,
        rows: dataRows,
        rawRows: allRows.slice(1)
      });
    }
  }

  if (sheets.length === 0) {
    sheets.push({
      sheetName: 'Hoja 1',
      headers: [],
      rows: [],
      rawRows: []
    });
  }

  return sheets;
}
