-- Check for attendance records on Sundays (should not have P or A status)
SELECT 
  sa.id,
  sa.student_id,
  sa.date,
  TO_CHAR(sa.date, 'Day') as day_name,
  sa.status,
  sa.month,
  sa.year
FROM student_attendance sa
WHERE EXTRACT(DOW FROM sa.date) = 0  -- 0 = Sunday
  AND sa.status IN ('P', 'A')
  AND sa.year = 2026
  AND sa.month = 'June'
ORDER BY sa.date;

-- Delete incorrect Sunday attendance records (P or A on Sundays)
DELETE FROM student_attendance
WHERE EXTRACT(DOW FROM date) = 0  -- Sunday
  AND status IN ('P', 'A')
  AND year = 2026
  AND month = 'June';

-- Verify deletion
SELECT COUNT(*) as remaining_sunday_records
FROM student_attendance
WHERE EXTRACT(DOW FROM date) = 0
  AND status IN ('P', 'A')
  AND year = 2026
  AND month = 'June';
