-- FIND GHOST RECORDS (showing in calendar but not in daily registration)
-- These are attendance records that shouldn't exist

-- Step 1: Show all July attendance records
SELECT 
  sa.id,
  sa.student_id,
  sa.date,
  TO_CHAR(sa.date, 'Day') as day_name,
  sa.status,
  s.name,
  s.student_id as entry_number
FROM student_attendance sa
LEFT JOIN students s ON s.id = sa.student_id
WHERE sa.month = 'July' 
  AND sa.year = 2026
  AND sa.status IN ('P', 'A')
ORDER BY sa.date;

-- Step 2: DELETE ghost records for July 5 and 12 (marked as P but shouldn't be)
DELETE FROM student_attendance
WHERE month = 'July'
  AND year = 2026
  AND DATE_TRUNC('day', date) IN ('2026-07-05'::date, '2026-07-12'::date)
  AND status IN ('P', 'A');

-- Step 3: Verify deletion
SELECT 
  'Cleanup Complete' as status,
  COUNT(*) as remaining_july_records
FROM student_attendance
WHERE month = 'July' AND year = 2026 AND status IN ('P', 'A');
