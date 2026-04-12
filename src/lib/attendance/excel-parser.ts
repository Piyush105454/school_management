import * as XLSX from "xlsx";

export interface AttendanceData {
  month: string;
  year: number;
  overall: any[];
  students: any[];
  classAttendance: any[];
  sheetNames: string[];
}

export function parseAttendanceExcel(buffer: Buffer): AttendanceData {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  
  // 1. Detect Month/Year from "Overall Attendance" sheet
  const overallSheet = workbook.Sheets["Overall Attendance"];
  if (!overallSheet) throw new Error("Missing 'Overall Attendance' sheet");
  
  const monthYearRaw = overallSheet["A3"]?.v as string; // e.g. "April-2026"
  if (!monthYearRaw) throw new Error("Could not find Month-Year in Overall Attendance!A3");
  
  const [month, yearStr] = monthYearRaw.split("-");
  const year = parseInt(yearStr);

  // 2. Parse "Overall Attendance"
  const overallData: any[] = [];
  const overallRows = XLSX.utils.sheet_to_json(overallSheet, { header: 1, range: 4 }) as any[][];
  // Row 5 is headers, so range 4 starts at row 5. Data starts at row 6.
  
  overallRows.forEach((row, index) => {
    if (index === 0) return; // Skip header row
    const dateNum = row[0];
    const day = row[1];
    const total = row[2];
    const present = row[3];
    const absent = row[4];
    const attendancePct = row[5];

    if (!dateNum || day === "Su" || (typeof day === "string" && day.includes("HOLIDAY"))) return;

    // Convert date numeric to Date object
    const date = new Date(year, getMonthIndex(month), dateNum);

    overallData.push({
      date,
      day,
      total: parseInt(total) || 0,
      present: parseInt(present) || 0,
      absent: parseInt(absent) || 0,
      attendancePct: parseInt(attendancePct) || 0,
      month,
      year
    });
  });

  // 3. Parse "Student wise"
  const studentSheet = workbook.Sheets["Student wise"];
  const studentData: any[] = [];
  if (studentSheet) {
    const studentRows = XLSX.utils.sheet_to_json(studentSheet, { header: 1 }) as any[][];
    // Data usually starts after a few rows of titles/headers
    studentRows.forEach((row) => {
      const sId = String(row[0] || "").trim();
      const sName = String(row[1] || "").trim();

      // Skip title rows, headers, or empty rows
      if (!sId || sId === "Student_id" || sId === "Student wise" || sId === "Name" || !sName) return;
      if (sId.includes("Dhanpuri")) return;

      studentData.push({
        studentId: sId,
        name: sName
      });
    });
  }

  // 4. Parse "CLASS X" sheets
  const classAttendance: any[] = [];
  workbook.SheetNames.forEach(sheetName => {
    if (sheetName.startsWith("CLASS")) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      const grade = parseInt(sheetName.replace("CLASS ", "")) || 0;
      const className = sheetName;
      
      // Row 5 (index 4) has student_id, name, and then dates 1-30/31
      // Row 6 (index 5) has day names
      const headers = rows[4];
      const dayNames = rows[5];

      for (let i = 6; i < rows.length; i++) {
        const row = rows[i];
        const studentId = String(row[0]);
        const name = row[1];
        if (!studentId || studentId === "undefined") continue;

        // Iterate through columns 2 onwards for dates
        for (let col = 2; col < row.length - 1; col++) { // Skip column 0, 1 and last column 'T'
          const dateNum = parseInt(headers[col]);
          const dayName = dayNames[col];
          const status = row[col];

          if (isNaN(dateNum)) continue;
          if (dayName === "Su" || status === "HOLIDAY") continue;

          if (status === "P" || status === "A") {
            const date = new Date(year, getMonthIndex(month), dateNum);
            classAttendance.push({
              studentId,
              className,
              grade,
              date,
              day: dayName,
              status,
              month,
              year
            });
          }
        }
      }
    }
  });

  return { 
    month, 
    year, 
    overall: overallData, 
    students: studentData, 
    classAttendance,
    sheetNames: workbook.SheetNames 
  };
}

function getMonthIndex(monthName: string): number {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return months.indexOf(monthName);
}
