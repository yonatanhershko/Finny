import { formatAmount, type Transaction } from '@finny/shared';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export type ExportLabels = {
  headers: { date: string; type: string; category: string; description: string; amount: string };
  income: string;
  expense: string;
};

function cell(value: string): string {
  // Quote everything; neutralize cells a spreadsheet would run as a formula.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** CSV text that Excel and Google Sheets open directly, Hebrew included. */
export function buildCsv(
  transactions: Transaction[],
  categoryName: (id: string) => string,
  labels: ExportLabels,
): string {
  const h = labels.headers;
  const lines = [[h.date, h.type, h.category, h.description, h.amount].map(cell).join(',')];
  for (const tx of transactions) {
    lines.push(
      [
        cell(tx.date),
        cell(tx.type === 'income' ? labels.income : labels.expense),
        cell(categoryName(tx.category_id)),
        cell(tx.description),
        // plain number so the sheet can sum it; exact, from integer minor units
        formatAmount(tx.amount).replace(/,/g, ''),
      ].join(','),
    );
  }
  // The byte-order mark makes Excel read the file as UTF-8.
  return `﻿${lines.join('\r\n')}\r\n`;
}

/** Save / share the CSV. Returns false when sharing is not possible on this device. */
export async function shareCsv(csv: string, fileName: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    return true;
  }
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(csv);
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
  return true;
}
