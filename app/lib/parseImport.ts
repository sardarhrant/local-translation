const DELIMITERS = ["\t", " - ", " – ", ";", ","];

export interface ImportedLine {
  source: string;
  target: string;
}

export interface ParseImportResult {
  lines: ImportedLine[];
  skipped: number;
}

/**
 * Parses pasted text into source/target pairs, one per line. Accepts tab,
 * " - ", " – ", ";" or "," as the separator between the two columns (in that
 * priority order), since that covers copy-pasting from a spreadsheet export
 * as well as plain "word - translation" lists. The caller decides which
 * column is English and which is Russian based on the selected direction.
 */
export function parseImportText(text: string): ParseImportResult {
  const lines: ImportedLine[] = [];
  let skipped = 0;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const delimiter = DELIMITERS.find((d) => line.includes(d));
    if (!delimiter) {
      skipped++;
      continue;
    }

    const [source, target] = line.split(delimiter).map((part) => part.trim());
    if (!source || !target) {
      skipped++;
      continue;
    }

    lines.push({ source, target });
  }

  return { lines, skipped };
}
