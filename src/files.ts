import type { CellValue } from 'exceljs';
import type { PDFFont } from 'pdf-lib';
import { moduleLabels, type DemoDocument } from './domain';
import { getAttachment } from './storage';

type RawCell = string | number | Date | null;
interface GpsRow { vehicle: string; date: string; origin: string; destination: string; km: number }

function today(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseDelimited(source: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  const input = source.replace(/^\uFEFF/, '');
  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (char === '"') {
      if (quoted && input[index + 1] === '"') { value += '"'; index++; }
      else if (quoted || value.length === 0) quoted = !quoted;
      else value += char;
    } else if (char === delimiter && !quoted) {
      row.push(value); value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[index + 1] === '\n') index++;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = []; value = '';
    } else value += char;
  }
  if (quoted) throw new Error('El CSV contiene comillas sin cerrar. Revisá el archivo e intentá nuevamente.');
  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

function detectDelimiter(source: string): string {
  const firstLine = source.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0];
  return [',', ';', '\t'].map((delimiter) => ({ delimiter, count: parseDelimited(firstLine, delimiter)[0]?.length || 0 }))
    .sort((a, b) => b.count - a.count)[0].delimiter;
}

function excelCell(value: CellValue): RawCell {
  if (value == null) return null;
  if (value instanceof Date || typeof value === 'string' || typeof value === 'number') return value;
  if (typeof value === 'boolean') return String(value);
  if ('result' in value) return excelCell(value.result as CellValue);
  if ('text' in value) return value.text;
  if ('richText' in value) return value.richText.map((part) => part.text).join('');
  return '';
}

function parseDate(value: RawCell, line: number): string {
  let year: number; let month: number; let day: number;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    year = value.getUTCFullYear(); month = value.getUTCMonth() + 1; day = value.getUTCDate();
  } else if (typeof value === 'number' && value >= 36526 && value < 73416) {
    const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000);
    year = date.getUTCFullYear(); month = date.getUTCMonth() + 1; day = date.getUTCDate();
  } else {
    const text = String(value ?? '').trim();
    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/.exec(text);
    const local = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(text);
    if (iso) { year = Number(iso[1]); month = Number(iso[2]); day = Number(iso[3]); }
    else if (local) { year = Number(local[3]); month = Number(local[2]); day = Number(local[1]); }
    else throw new Error(`Fila ${line}: Fecha inválida. Usá AAAA-MM-DD o DD/MM/AAAA.`);
  }
  const check = new Date(Date.UTC(year, month - 1, day));
  if (year < 2000 || year > 2100 || check.getUTCFullYear() !== year || check.getUTCMonth() + 1 !== month || check.getUTCDate() !== day) {
    throw new Error(`Fila ${line}: la fecha no es válida o está fuera del rango 2000–2100.`);
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseKm(value: RawCell, line: number): number {
  const source = String(value ?? '').trim();
  if (!/^\d+(?:[.,]\d+)?$/.test(source)) {
    throw new Error(`Fila ${line}: Km debe ser un número sin separadores de miles ni unidades (ejemplo: 125,5).`);
  }
  const km = Number(source.replace(',', '.'));
  if (!Number.isFinite(km) || km < 0 || km > 1000000) throw new Error(`Fila ${line}: revisá el valor de Km.`);
  return km;
}

export async function importGpsFile(file: File, workId: string): Promise<DemoDocument[]> {
  if (!workId) throw new Error('Elegí la obra antes de importar.');
  if (file.size > 15 * 1024 * 1024) throw new Error('El archivo supera 15 MB. Usá un reporte más pequeño para esta demo.');
  const extension = file.name.split('.').pop()?.toLowerCase();
  let table: RawCell[][];
  if (extension === 'csv') {
    const source = await file.text();
    table = parseDelimited(source, detectDelimiter(source));
  } else if (extension === 'xlsx') {
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    try {
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer as Parameters<typeof workbook.xlsx.load>[0]);
    } catch {
      throw new Error('No pudimos leer este XLSX. Revisá que no esté protegido ni dañado, o exportalo como CSV.');
    }
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error('El archivo no tiene una hoja de cálculo.');
    if (sheet.rowCount > 10001 || sheet.columnCount > 128) throw new Error('Usá un archivo de hasta 10.000 registros y 128 columnas para esta demo.');
    table = [];
    sheet.eachRow((row) => {
      const values = Array.from({ length: sheet.columnCount }, (_, index) => excelCell(row.getCell(index + 1).value));
      if (values.some((value) => value != null && String(value).trim())) table.push(values);
    });
  } else if (extension === 'xls') {
    throw new Error('El formato XLS antiguo no está admitido. Abrilo en Excel y guardalo como XLSX o CSV.');
  } else throw new Error('Elegí un archivo XLSX o CSV con las columnas Patente, Fecha, Origen, Destino y Km.');

  if (table.length < 2) throw new Error('El archivo debe contener encabezados y al menos un recorrido.');
  if (table.length > 10001) throw new Error('Usá un archivo de hasta 10.000 recorridos para esta demo.');
  const headers = table[0].map((value) => String(value ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  const required = ['patente', 'fecha', 'origen', 'destino', 'km'];
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`Faltan columnas: ${missing.join(', ')}. Descargá la plantilla para ver el formato compatible.`);
  if (required.some((header) => headers.filter((value) => value === header).length !== 1)) throw new Error('Hay encabezados obligatorios repetidos. Dejá una sola columna por campo.');
  const positions = Object.fromEntries(required.map((header) => [header, headers.indexOf(header)]));
  const records: GpsRow[] = table.slice(1).map((row, index) => {
    const line = index + 2;
    const vehicle = String(row[positions.patente] ?? '').trim().toUpperCase();
    const origin = String(row[positions.origen] ?? '').trim();
    const destination = String(row[positions.destino] ?? '').trim();
    if (!vehicle || vehicle.length > 40) throw new Error(`Fila ${line}: indicá una Patente o identificador de vehículo de hasta 40 caracteres.`);
    if (!origin || !destination) throw new Error(`Fila ${line}: completá Origen y Destino.`);
    return { vehicle, origin, destination, date: parseDate(row[positions.fecha] ?? null, line), km: parseKm(row[positions.km] ?? null, line) };
  });

  const groups = new Map<string, GpsRow[]>();
  for (const record of records) {
    const key = `${record.vehicle}\u0000${record.date.slice(0, 7)}`;
    const group = groups.get(key);
    if (group) group.push(record);
    else groups.set(key, [record]);
  }
  return [...groups.values()].map((rows) => {
    const dates = rows.map((row) => row.date).sort();
    const vehicle = rows[0].vehicle;
    const period = rows[0].date.slice(0, 7);
    const distance = rows.reduce((sum, row) => sum + row.km, 0);
    return {
      id: crypto.randomUUID(), title: `Recorridos ${vehicle} · ${period}`,
      module: 'vehicles', workId, period, status: 'Pendiente de revisión', owner: 'Alexis',
      updatedAt: today(), vehicle,
      notes: `Importado desde ${file.name}. ${rows.length} recorrido(s), del ${dates[0]} al ${dates[dates.length - 1]}. Distancia total del archivo: ${distance.toLocaleString('es-AR', { maximumFractionDigits: 2 })} km. Agrupación por vehículo y mes; las fechas indican la cobertura real del archivo, no un mes completo. Formato de plantilla, sin conexión ni normalización automática de proveedores.`,
    };
  });
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function safeFilename(title: string): string {
  return title.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-').trim().slice(0, 120) || 'documento';
}

function printable(value: string, font: PDFFont): string {
  return [...value.replace(/[–—]/g, '-').replace(/→/g, '>').replace(/\t/g, ' ')].map((character) => {
    if (character === '\n') return character;
    try { font.encodeText(character); return character; } catch { return ''; }
  }).join('');
}

export async function downloadDocument(document: DemoDocument, workName: string): Promise<void> {
  if (document.attachmentId) {
    const attachment = await getAttachment(document.attachmentId);
    if (!attachment) throw new Error('No se encontró el archivo adjunto en este navegador. Volvé a cargarlo.');
    download(attachment.blob, attachment.name);
    return;
  }
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  pdf.setTitle(document.title);
  pdf.setAuthor('METALFAST Campo - Demo');
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.07, 0.2, 0.25);
  const muted = rgb(0.35, 0.43, 0.47);
  const teal = rgb(0, 0.47, 0.43);
  let page = pdf.addPage([595.28, 841.89]);
  let y = 0;
  function newPage(first = false) {
    if (!first) page = pdf.addPage([595.28, 841.89]);
    page.drawRectangle({ x: 0, y: 765, width: 596, height: 77, color: ink });
    page.drawText('METALFAST Campo', { x: 44, y: 804, size: 18, font: bold, color: rgb(1, 1, 1) });
    page.drawText('DEMO - DATOS SIMULADOS', { x: 44, y: 783, size: 9, font: bold, color: rgb(0.55, 0.91, 0.82) });
    y = 728;
  }
  function paragraph(text: string, size = 11, font: PDFFont = regular, color = ink) {
    const clean = printable(text, font);
    const width = 507;
    for (const part of clean.split('\n')) {
      let line = '';
      const words = part.split(/\s+/);
      for (const word of words) {
        const proposed = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(proposed, size) > width && line) {
          if (y < 64) newPage();
          page.drawText(line, { x: 44, y, size, font, color }); y -= size * 1.5; line = '';
        }
        if (font.widthOfTextAtSize(word, size) > width) {
          for (const character of word) {
            if (font.widthOfTextAtSize(line + character, size) > width) {
              if (y < 64) newPage();
              page.drawText(line, { x: 44, y, size, font, color }); y -= size * 1.5; line = '';
            }
            line += character;
          }
        } else line = line ? `${line} ${word}` : word;
      }
      if (y < 64) newPage();
      page.drawText(line, { x: 44, y, size, font, color }); y -= size * 1.5;
    }
    y -= 7;
  }
  function field(label: string, value: string) {
    paragraph(label.toUpperCase(), 8, bold, muted);
    paragraph(value, 11);
  }
  newPage(true);
  paragraph(document.title, 21, bold);
  paragraph(moduleLabels[document.module], 11, bold, teal);
  y -= 9;
  field('Obra', workName);
  field('Período', document.period);
  field('Estado del registro de demostración', document.status);
  field('Responsable', document.owner);
  field('Actualizado', document.updatedAt);
  if (document.vehicle) field('Vehículo', document.vehicle);
  if (document.provider) field('Proveedor indicado', document.provider);
  if (document.module === 'quality') {
    field('Firma interna - SIMULADA', document.signatureInternal ? 'Conformidad registrada en la demo' : 'Pendiente');
    field('Firma de contraparte - SIMULADA', document.signatureExternal ? 'Conformidad registrada en la demo' : 'Pendiente');
  }
  if (document.notes) field('Notas', document.notes);
  paragraph('Resumen de demostración. Los estados de aprobación, firma y envío son simulados. No contiene una firma digital ni autoriza trabajos reales.', 9, regular, muted);
  const pages = pdf.getPages();
  pages.forEach((item, index) => {
    item.drawLine({ start: { x: 44, y: 42 }, end: { x: 551, y: 42 }, color: rgb(0.84, 0.89, 0.9), thickness: 0.5 });
    item.drawText(`METALFAST Campo | Demo | ${index + 1} / ${pages.length}`, { x: 44, y: 27, size: 8, font: regular, color: muted });
  });
  const bytes = await pdf.save();
  download(new Blob([bytes as BlobPart], { type: 'application/pdf' }), `${safeFilename(document.title)}.pdf`);
}

export async function downloadGpsTemplate(): Promise<void> {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'METALFAST Campo - Demo';
  const sheet = workbook.addWorksheet('Recorridos');
  sheet.columns = [
    { header: 'Patente', key: 'vehicle', width: 19 },
    { header: 'Fecha', key: 'date', width: 17 },
    { header: 'Origen', key: 'origin', width: 27 },
    { header: 'Destino', key: 'destination', width: 27 },
    { header: 'Km', key: 'km', width: 15 },
  ];
  sheet.addRows([
    { vehicle: 'AB 123 CD', date: '2026-10-26', origin: 'Base Neuquén', destination: 'Frente de obra', km: 82.5 },
    { vehicle: 'AB 123 CD', date: '2026-10-27', origin: 'Frente de obra', destination: 'Base Neuquén', km: 84 },
    { vehicle: 'AF 456 GH', date: '2026-10-27', origin: 'Base Neuquén', destination: 'Taller', km: 14.2 },
  ]);
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF123D49' } };
    cell.alignment = { vertical: 'middle' };
  });
  sheet.getRow(1).height = 28;
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = 'A1:E4';
  sheet.getColumn('km').numFmt = '0.00';
  const help = workbook.addWorksheet('Leer primero');
  help.getColumn(1).width = 115;
  [
    'METALFAST Campo · DEMO. Los tres recorridos de la primera hoja son ficticios.',
    'Reemplazá los ejemplos por tus datos y conservá los encabezados Patente, Fecha, Origen, Destino y Km.',
    'Solo se importa la primera hoja. Las fechas deben ser AAAA-MM-DD o DD/MM/AAAA; Km sin separadores de miles.',
    'La importación agrupa por vehículo y mes. No implica que el reporte cubra el mes completo.',
    'Este formato de plantilla no representa el formato real de Microtrack, RSV ni Full Control.',
    'No hay conexiones a GPS, descargas programadas ni envíos automáticos en esta demo.',
  ].forEach((text) => help.addRow([text]));
  const bytes = await workbook.xlsx.writeBuffer();
  download(new Blob([bytes as unknown as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'METALFAST-plantilla-recorridos-demo.xlsx');
}
