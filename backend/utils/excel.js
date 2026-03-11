const ExcelJS = require('exceljs');

const CURRENCY_FULL = '_("$"* #,##0.00_);_("$"* \\(#,##0.00\\);_("$"* "-"??_);_(@_)';
const CURRENCY_INT = '_("$"* #,##0_);_("$"* \\(#,##0\\);_("$"* "-"_);_(@_)';
const PCT_WHOLE = '0%';
const PCT_DECIMAL = '0.0%';
const TEXT_FMT = '@';

function col(n) {
  // Convert 1-based column number to Excel column letter(s)
  let result = '';
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

// Column index mapping (1-based)
const COLS = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 10,
  K: 11, L: 12, M: 13, N: 14, O: 15, P: 16, Q: 17, R: 18, S: 19, T: 20,
  U: 21, V: 22, W: 23, X: 24, Y: 25, Z: 26,
  AA: 27, AB: 28, AC: 29, AD: 30, AE: 31, AF: 32, AG: 33, AH: 34, AI: 35, AJ: 36,
  AK: 37, AL: 38, AM: 39, AN: 40
};

function cellRef(colName, rowNum) {
  return `${colName}${rowNum}`;
}

async function generateExcel(order, lines) {
  const workbook = new ExcelJS.Workbook();
  const sheetName = `${order.customer_code || 'SO'} ${order.so_number || ''}`.trim().substring(0, 31);
  const ws = workbook.addWorksheet(sheetName);

  // Set column widths
  const colWidths = [
    { col: 'A', width: 9 },
    { col: 'B', width: 41.875 },
    { col: 'C', width: 46.625 },
    { col: 'D', width: 20 },
    { col: 'E', width: 26.75 },
    { col: 'F', width: 16.25 },
    { col: 'G', width: 15.75 },
    { col: 'H', width: 14 },
    { col: 'I', width: 17.375 },
    { col: 'J', width: 24.25 },
    { col: 'K', width: 14 },
    { col: 'L', width: 34 },
    { col: 'M', width: 14.75 },
    { col: 'N', width: 8.5 },
    { col: 'O', width: 14.375 },
    { col: 'P', width: 14.375 },
    { col: 'Q', width: 14.375 },
    { col: 'R', width: 14.375 },
    { col: 'S', width: 14.375 },
    { col: 'Y', width: 17 },
    { col: 'Z', width: 14.375 },
    { col: 'AF', width: 14.375 },
    { col: 'AG', width: 16.875 },
    { col: 'AH', width: 14.375 },
    { col: 'AI', width: 8.875 },
    { col: 'AJ', width: 15.25 }
  ];

  for (const { col: c, width } of colWidths) {
    ws.getColumn(COLS[c]).width = width;
  }

  // Helper to set row height
  function setRowHeight(rowNum, height) {
    ws.getRow(rowNum).height = height;
  }

  // Set header row heights (1-9: 30pt, 10: 72pt)
  for (let i = 1; i <= 9; i++) setRowHeight(i, 30);
  setRowHeight(10, 72);

  // Helper to set cell value and format
  function setCell(rowNum, colName, value, numFmt, bold) {
    const cell = ws.getCell(rowNum, COLS[colName]);
    cell.value = value;
    if (numFmt) cell.numFmt = numFmt;
    if (bold) cell.font = { bold: true };
    return cell;
  }

  // ── HEADER BLOCK (rows 1-7) ──────────────────────────────────────────────
  setCell(1, 'B', 'CUSTOMER #:', null, true);
  setCell(1, 'C', order.customer_code || '', TEXT_FMT);
  setCell(2, 'B', 'CUSTOMER NAME:', null, true);
  setCell(2, 'C', order.customer_name || '', TEXT_FMT);
  setCell(3, 'B', 'PO #:', null, true);
  setCell(3, 'C', order.po_number || '', TEXT_FMT);
  setCell(4, 'B', 'SO #:', null, true);
  setCell(4, 'C', order.so_number || '', TEXT_FMT);
  setCell(5, 'B', 'LOG #:', null, true);
  setCell(5, 'C', order.log_number || '', TEXT_FMT);
  setCell(6, 'B', 'SALES PERSON:', null, true);
  setCell(6, 'C', order.salesperson || '', TEXT_FMT);
  setCell(7, 'B', 'ENTERED BY:', null, true);
  setCell(7, 'C', order.entered_by || '', TEXT_FMT);

  // Right side of header
  setCell(1, 'I', "TODAY'S DATE:", null, true);
  // Store date as string (could be Excel date value if we parse it)
  const orderDateCell = ws.getCell(1, COLS['L']);
  if (order.order_date) {
    const d = new Date(order.order_date + 'T00:00:00');
    if (!isNaN(d)) {
      orderDateCell.value = d;
      orderDateCell.numFmt = 'mm/dd/yyyy';
    } else {
      orderDateCell.value = order.order_date;
    }
  }

  setCell(2, 'I', 'SHIP DATE:', null, true);
  const shipDateCell = ws.getCell(2, COLS['L']);
  if (order.ship_date) {
    const d = new Date(order.ship_date + 'T00:00:00');
    if (!isNaN(d)) {
      shipDateCell.value = d;
      shipDateCell.numFmt = 'mm/dd/yyyy';
    } else {
      shipDateCell.value = order.ship_date;
    }
  }

  setCell(3, 'I', 'CANCEL DATE:', null, true);
  setCell(3, 'L', order.cancel_date || '', TEXT_FMT);
  setCell(4, 'I', 'MABD', null, true);
  setCell(4, 'L', order.mabd || '', TEXT_FMT);

  // ── ROW 9 - Global rates ─────────────────────────────────────────────────
  setCell(9, 'AA', order.nj_wh_rate ?? 0, PCT_DECIMAL);
  setCell(9, 'AB', order.ca_wh_rate ?? 0.07, PCT_DECIMAL);
  setCell(9, 'AC', order.terms_rate ?? 0.053, PCT_DECIMAL);

  // ── ROW 10 - Column Headers ───────────────────────────────────────────────
  const headers = [
    ['A', 'LINE'], ['B', 'IMAGE'], ['C', 'DESCRIPTION'], ['D', 'PRODUCT'],
    ['E', 'COLOR'], ['F', 'SIZE'], ['G', 'PPK/CTG'], ['H', 'QTY'],
    ['I', 'SELL PRICE'], ['J', 'EXT SELL'], ['K', 'RETAIL PRICE'], ['L', 'REMARKS'],
    ['O', 'CUSTOMER'], ['P', 'SO #'], ['Q', 'VENDOR'], ['R', 'VPO #'],
    ['S', '1ST COST'], ['T', 'DUTY'], ['U', 'TARIFF 1'], ['V', 'TARIFF 2'],
    ['W', 'AGENT'], ['X', 'FREIGHT'], ['Y', 'ROYALTY'], ['Z', 'MISC'],
    ['AA', 'NJ WH'], ['AB', 'CA WH'], ['AC', 'TERMS'], ['AD', 'SELL'],
    ['AE', 'LANDED'], ['AF', 'MARKUP'], ['AG', 'EXT LANDED'], ['AH', 'MODE'],
    ['AJ', 'TERMS'], ['AK', 'DUTY %'], ['AL', 'TARIFF 1 %'],
    ['AM', 'TARIFF 2 %'], ['AN', 'ROYALTY %']
  ];

  for (const [c, label] of headers) {
    setCell(10, c, label, null, true);
  }

  // ── DATA ROWS ─────────────────────────────────────────────────────────────
  const firstDataRow = 11;
  const lastDataRow = firstDataRow + lines.length - 1;

  lines.forEach((line, idx) => {
    const r = firstDataRow + idx;
    setRowHeight(r, 70);

    // A: line number
    ws.getCell(r, COLS['A']).value = line.line_number || (idx + 1);

    // B: image (leave empty)
    ws.getCell(r, COLS['B']).value = '';

    // C: description
    const cCell = ws.getCell(r, COLS['C']);
    cCell.value = line.description || '';
    cCell.numFmt = TEXT_FMT;

    // D: style_number
    ws.getCell(r, COLS['D']).value = line.style_number || '';

    // E: color
    const eCell = ws.getCell(r, COLS['E']);
    eCell.value = line.color || '';
    eCell.numFmt = TEXT_FMT;

    // F: size
    ws.getCell(r, COLS['F']).value = line.size || '';

    // G: ppk_ctg
    ws.getCell(r, COLS['G']).value = line.ppk_ctg || 0;

    // H: qty
    ws.getCell(r, COLS['H']).value = line.qty || 0;

    // I: sell_price
    const iCell = ws.getCell(r, COLS['I']);
    iCell.value = line.sell_price || 0;
    iCell.numFmt = CURRENCY_FULL;

    // J: =+H*I
    const jCell = ws.getCell(r, COLS['J']);
    jCell.value = { formula: `+H${r}*I${r}` };
    jCell.numFmt = CURRENCY_FULL;

    // K: retail_price
    const kCell = ws.getCell(r, COLS['K']);
    kCell.value = line.retail_price || 0;
    kCell.numFmt = CURRENCY_FULL;

    // L: remarks
    ws.getCell(r, COLS['L']).value = line.remarks || '';

    // M, N: empty

    // O: =$C$1
    const oCell = ws.getCell(r, COLS['O']);
    oCell.value = { formula: `$C$1` };
    oCell.numFmt = TEXT_FMT;

    // P: =$C$4
    const pCell = ws.getCell(r, COLS['P']);
    pCell.value = { formula: `$C$4` };
    pCell.numFmt = TEXT_FMT;

    // Q: vendor (currency format per template)
    const qCell = ws.getCell(r, COLS['Q']);
    qCell.value = line.vendor || '';
    qCell.numFmt = CURRENCY_FULL;

    // R: vpo_number
    ws.getCell(r, COLS['R']).value = line.vpo_number || '';

    // S: first_cost
    const sCell = ws.getCell(r, COLS['S']);
    sCell.value = line.first_cost || 0;
    sCell.numFmt = CURRENCY_FULL;

    // T: =S*AK
    const tCell = ws.getCell(r, COLS['T']);
    tCell.value = { formula: `S${r}*AK${r}` };
    tCell.numFmt = CURRENCY_FULL;

    // U: =AL*S
    const uCell = ws.getCell(r, COLS['U']);
    uCell.value = { formula: `AL${r}*S${r}` };
    uCell.numFmt = CURRENCY_FULL;

    // V: =S*AM
    const vCell = ws.getCell(r, COLS['V']);
    vCell.value = { formula: `S${r}*AM${r}` };
    vCell.numFmt = CURRENCY_FULL;

    // W: agent_fee
    const wCell = ws.getCell(r, COLS['W']);
    wCell.value = line.agent_fee || 0;
    wCell.numFmt = CURRENCY_FULL;

    // X: freight
    const xCell = ws.getCell(r, COLS['X']);
    xCell.value = line.freight ?? 0.15;
    xCell.numFmt = CURRENCY_FULL;

    // Y: =I*AN
    const yCell = ws.getCell(r, COLS['Y']);
    yCell.value = { formula: `I${r}*AN${r}` };
    yCell.numFmt = CURRENCY_FULL;

    // Z: misc
    const zCell = ws.getCell(r, COLS['Z']);
    zCell.value = line.misc ?? 0.07;
    zCell.numFmt = CURRENCY_FULL;

    // AA: =$AA$9
    const aaCell = ws.getCell(r, COLS['AA']);
    aaCell.value = { formula: `$AA$9` };
    aaCell.numFmt = CURRENCY_FULL;

    // AB: =$AB$9
    const abCell = ws.getCell(r, COLS['AB']);
    abCell.value = { formula: `$AB$9` };
    abCell.numFmt = CURRENCY_FULL;

    // AC: =ROUNDUP(AD*AJ,2)
    const acCell = ws.getCell(r, COLS['AC']);
    acCell.value = { formula: `ROUNDUP(AD${r}*AJ${r},2)` };
    acCell.numFmt = CURRENCY_FULL;

    // AD: =I
    const adCell = ws.getCell(r, COLS['AD']);
    adCell.value = { formula: `I${r}` };
    adCell.numFmt = CURRENCY_FULL;

    // AE: =SUM(S:AC)
    const aeCell = ws.getCell(r, COLS['AE']);
    aeCell.value = { formula: `SUM(S${r}:AC${r})` };
    aeCell.numFmt = CURRENCY_FULL;

    // AF: =IFERROR((AD-AE)/AD,0)
    const afCell = ws.getCell(r, COLS['AF']);
    afCell.value = { formula: `IFERROR((AD${r}-AE${r})/AD${r},0)` };
    afCell.numFmt = PCT_WHOLE;

    // AG: =AE*H
    const agCell = ws.getCell(r, COLS['AG']);
    agCell.value = { formula: `AE${r}*H${r}` };
    agCell.numFmt = CURRENCY_INT;

    // AH: shipping_mode (format '0%' per template)
    const ahCell = ws.getCell(r, COLS['AH']);
    ahCell.value = line.shipping_mode || 'BOAT';
    ahCell.numFmt = PCT_WHOLE;

    // AI: empty

    // AJ: =$AC$9
    const ajCell = ws.getCell(r, COLS['AJ']);
    ajCell.value = { formula: `$AC$9` };
    ajCell.numFmt = '0.0%';

    // AK: duty_pct
    const akCell = ws.getCell(r, COLS['AK']);
    akCell.value = line.duty_pct ?? 0.146;
    akCell.numFmt = PCT_DECIMAL;

    // AL: tariff1_pct
    const alCell = ws.getCell(r, COLS['AL']);
    alCell.value = line.tariff1_pct ?? 0.075;
    alCell.numFmt = PCT_DECIMAL;

    // AM: tariff2_pct
    const amCell = ws.getCell(r, COLS['AM']);
    amCell.value = line.tariff2_pct ?? 0.200;
    amCell.numFmt = PCT_DECIMAL;

    // AN: royalty_pct
    const anCell = ws.getCell(r, COLS['AN']);
    anCell.value = line.royalty_pct || 0;
    anCell.numFmt = PCT_DECIMAL;
  });

  // ── TOTALS ROW ────────────────────────────────────────────────────────────
  const totalsRow = lastDataRow + 1;
  setRowHeight(totalsRow, 36);

  const bTotals = ws.getCell(totalsRow, COLS['B']);
  bTotals.value = 'TOTAL';
  bTotals.font = { bold: true };

  ws.getCell(totalsRow, COLS['G']).value = { formula: `SUM(G${firstDataRow}:G${lastDataRow})` };
  ws.getCell(totalsRow, COLS['H']).value = { formula: `SUM(H${firstDataRow}:H${lastDataRow})` };
  ws.getCell(totalsRow, COLS['J']).value = { formula: `SUM(J${firstDataRow}:J${lastDataRow})` };
  ws.getCell(totalsRow, COLS['J']).numFmt = CURRENCY_FULL;

  const afTotals = ws.getCell(totalsRow, COLS['AF']);
  afTotals.value = { formula: `(J${totalsRow}-AG${totalsRow})/J${totalsRow}` };
  afTotals.numFmt = PCT_WHOLE;

  const agTotals = ws.getCell(totalsRow, COLS['AG']);
  agTotals.value = { formula: `SUBTOTAL(9,AG${firstDataRow}:AG${lastDataRow})` };
  agTotals.numFmt = CURRENCY_INT;

  // ── COMPLIANCE SECTION ────────────────────────────────────────────────────
  const checklistStartRow = totalsRow + 4;

  // Set row heights for compliance section
  for (let i = checklistStartRow; i <= checklistStartRow + 12; i++) {
    setRowHeight(i, 24);
  }

  

  // Row 0: Suffocation Warning
  ws.getCell(checklistStartRow, COLS['B']).value = 'SUFFOCATION WARNING';
  ws.getCell(checklistStartRow, COLS['C']).value = 'Warning in English & Spanish Required';
  ws.getCell(checklistStartRow, COLS['E']).value = !!order.suffocation_warning;
  ws.getCell(checklistStartRow, COLS['H']).value = 'DIRECT TO N.J';
  ws.getCell(checklistStartRow, COLS['L']).value = !!order.ship_direct_nj;

  // Row 1: Pre-Ticket
  ws.getCell(checklistStartRow + 1, COLS['B']).value = 'PRE-TICKET';
  ws.getCell(checklistStartRow + 1, COLS['E']).value = !!order.pre_ticket;
  ws.getCell(checklistStartRow + 1, COLS['H']).value = 'DIRECT TO L.A';
  ws.getCell(checklistStartRow + 1, COLS['L']).value = !!order.ship_direct_la;

  // Row 2: Pre-Pack
  ws.getCell(checklistStartRow + 2, COLS['B']).value = 'PRE-PACK';
  ws.getCell(checklistStartRow + 2, COLS['C']).value = order.pre_pack_details || '';
  ws.getCell(checklistStartRow + 2, COLS['E']).value = !!order.pre_pack;
  ws.getCell(checklistStartRow + 2, COLS['H']).value = 'FOB / DTC';
  ws.getCell(checklistStartRow + 2, COLS['L']).value = !!order.ship_fob_dtc;

  // Row 3: Pre-Pack Label
  ws.getCell(checklistStartRow + 3, COLS['B']).value = 'PRE-PACK LABEL';
  ws.getCell(checklistStartRow + 3, COLS['E']).value = !!order.pre_pack_label;
  ws.getCell(checklistStartRow + 3, COLS['H']).value = 'IN STOCK ORDER';
  ws.getCell(checklistStartRow + 3, COLS['L']).value = !!order.in_stock_order;

  // Row 4: Cards/Hangers
  ws.getCell(checklistStartRow + 4, COLS['B']).value = 'CARDS/HANGERS';
  ws.getCell(checklistStartRow + 4, COLS['C']).value = order.cards_hangers_brand || '';
  ws.getCell(checklistStartRow + 4, COLS['E']).value = !!order.cards_hangers;
  ws.getCell(checklistStartRow + 4, COLS['H']).value = 'CLOSEOUT ORDER';
  ws.getCell(checklistStartRow + 4, COLS['L']).value = !!order.closeout_order;

  // Row 5: Sewn In Label
  ws.getCell(checklistStartRow + 5, COLS['B']).value = 'SEWN IN LABEL';
  ws.getCell(checklistStartRow + 5, COLS['E']).value = !!order.sewn_in_label;
  ws.getCell(checklistStartRow + 5, COLS['H']).value = 'TOP SAMPLES';
  ws.getCell(checklistStartRow + 5, COLS['L']).value = !!order.top_samples;

  // Row 6: Testing Required
  ws.getCell(checklistStartRow + 6, COLS['B']).value = 'TESTING REQUIRED';
  ws.getCell(checklistStartRow + 6, COLS['C']).value = order.testing_procedure || '';
  ws.getCell(checklistStartRow + 6, COLS['E']).value = !!order.testing_required;
  ws.getCell(checklistStartRow + 6, COLS['H']).value = 'PRE-PRODUCTION SAMPLES';
  ws.getCell(checklistStartRow + 6, COLS['L']).value = !!order.pre_production_samples;

  // Other/Specify
  ws.getCell(checklistStartRow + 9, COLS['B']).value = 'OTHER/SPECIFY HERE';
  ws.getCell(checklistStartRow + 9, COLS['E']).value = order.other_notes || '';

  // Bold all compliance labels in column B
  for (let i = 0; i <= 6; i++) {
    ws.getCell(checklistStartRow + i, COLS['B']).font = { bold: true };
    ws.getCell(checklistStartRow + i, COLS['H']).font = { bold: true };
  }
  ws.getCell(checklistStartRow + 9, COLS['B']).font = { bold: true };

  return workbook;
}

module.exports = { generateExcel };
