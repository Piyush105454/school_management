import * as xlsx from "xlsx";

export interface AttendanceRecord {
  studentId: string;
  name: string;
  className: string;
  rollNumber: string | null;
  scholarNumber: string | null;
  date: Date;
  status: string; // P, A, L, ML, HD, H
}

export async function parseAttendanceExcel(file: File): Promise<AttendanceRecord[]> {
  const bytes = await file.arrayBuffer();
  const workbook = xlsx.read(bytes, { type: "array" });
  const records: AttendanceRecord[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    // Convert to 2D array to handle complex headers
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    if (rows.length < 3) continue;

    // Based on the user image:
    // Row 2 (index 1) contains dates starting from Column P (index 15)
    // Data starts from Row 3 (index 2)
    const headerRow = rows[1] || [];
    const dateColumns: { col: number; date: Date }[] = [];

    // Find date columns (starting from Column P / Index 15)
    for (let col = 15; col < headerRow.length; col++) {
      const cellValue = headerRow[col];
      if (cellValue) {
        let date: Date;
        if (typeof cellValue === 'number') {
          // Excel date serial
          date = new Date((cellValue - 25569) * 86400 * 1000);
        } else {
          date = new Date(cellValue);
        }
        
        if (!isNaN(date.getTime())) {
          dateColumns.push({ col, date });
        }
      }
    }

    // Process students starting from Row 3 (index 2)
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 3) continue;

      const name = String(row[0] || "").trim();
      const scholarNumber = String(row[1] || "").trim();
      const rollNumber = String(row[2] || "").trim();
      const className = String(row[3] || "").trim();
      
      // Skip junk rows
      if (!name || name.toUpperCase().startsWith("CLASS") || name.toUpperCase() === "NAME") continue;

      // Use a unique ID based on Scholar or Roll if entryNumber isn't available
      const studentId = scholarNumber || rollNumber || name;

      for (const dateCol of dateColumns) {
        const status = String(row[dateCol.col] || "").trim().toUpperCase();
        if (status) {
          records.push({
            studentId,
            name,
            className,
            rollNumber,
            scholarNumber,
            date: dateCol.date,
            status: status || "A"
          });
        }
      }
    }
  }

  return records;
}
