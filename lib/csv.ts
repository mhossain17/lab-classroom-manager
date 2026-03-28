export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  const pushCell = () => {
    currentRow.push(currentCell.trim());
    currentCell = "";
  };

  const pushRow = () => {
    if (currentRow.length === 0) {
      return;
    }

    const hasContent = currentRow.some((cell) => cell.length > 0);
    if (hasContent) {
      rows.push(currentRow);
    }

    currentRow = [];
  };

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];

    if (char === '"') {
      const next = csvText[index + 1];
      if (inQuotes && next === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      pushCell();
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && csvText[index + 1] === "\n") {
        index += 1;
      }
      pushCell();
      pushRow();
      continue;
    }

    currentCell += char;
  }

  pushCell();
  pushRow();

  return rows;
}

export function normalizeCsvHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function safeUsernameBase(input: string): string {
  const sanitized = input
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 24);

  return sanitized.length > 0 ? sanitized : "student";
}
