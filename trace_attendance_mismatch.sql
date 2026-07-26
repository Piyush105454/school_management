-- TRACE THE MISMATCH - Find which student and which records don't align

-- Step 1: Show all students with July attendance data
SELECT 
  s.id as student_id,
  s.name,
  s.student_id as entry_number,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE sa.status = 'P') as present_count,
  COUNT(*) FILTER (WHERE sa.status = 'A') as absent_count
FROM students s
LEFT JOIN student_attendance sa ON sa.student_id = s.id 
  AND sa.month = 'July' 
  AND sa.year = 2026
GROUP BY s.id, s.name, s.student_id
HAVING COUNT(*) > 0
ORDER BY s.name;

-- Step 2: Show specific records for the mismatched student (July 5 and 12)
SELECT 
  s.name,
  sa.student_id,
  sa.date,
  sa.status,
  sa.month,
  sa.year
FROM student_attendance sa
INNER JOIN students s ON s.id = sa.student_id
WHERE sa.month = 'July'
  AND sa.year = 2026
  AND (EXTRACT(DAY FROM sa.date) = 5 OR EXTRACT(DAY FROM sa.date) = 12)
ORDER BY s.name, sa.date;

-- Step 3: Show admission link for this student
SELECT 
  s.id,
  s.name,
  s.student_id as entry_number,
  am.entry_number as admission_entry,
  am.id as admission_id
FROM students s
LEFT JOIN admission_meta am ON am.entry_number = s.student_id
ORDER BY s.name;
