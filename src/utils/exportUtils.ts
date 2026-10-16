/**
 * Utilities for exporting scraped data into CSV, JSON, and downloading files.
 */

export function downloadJsonFile(data: any, filename: string = 'scraped_data.json') {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function convertToCsv(items: Record<string, any>[]): string {
  if (!items || items.length === 0) return '';

  // Extract all unique keys
  const keys = Array.from(
    new Set(
      items.flatMap(item => Object.keys(item)).filter(k => !k.startsWith('_'))
    )
  );

  // Header row
  const header = keys.map(k => `"${k.replace(/"/g, '""')}"`).join(',');

  // Data rows
  const rows = items.map(item => {
    return keys
      .map(k => {
        const val = item[k];
        if (val === null || val === undefined) return '""';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  return [header, ...rows].join('\n');
}

export function downloadCsvFile(items: Record<string, any>[], filename: string = 'scraped_data.csv') {
  const csvStr = convertToCsv(items);
  const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
