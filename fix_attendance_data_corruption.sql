-- SAFE READ-ONLY VERIFICATION - NO DATA DELETION
-- This shows what data is causing the mismatch between views

-- Show all Sunday records marked as Present/Absent
SELECT 
  'SUNDAY RECORDS' as issue_type,
  COUNT(*) as count,
  STRING_AGG(DISTINCT sa.id::text, ', ') as record_ids
FROM student_attendance sa
WHERE EXTRACT(DOW FROM sa.date) = 0  -- Sunday = 0
  AND sa.status IN ('P', 'A');

-- Compare: Class Attendance Grid data vs Student Attendance Calendar data
SELECT 
  s.id as student_id,
  s.name,
  sa2.month,
  sa2.year,
  COUNT(*) FILTER (WHERE sa.status IN ('P', 'A')) as total_days_marked,
  COUNT(*) FILTER (WHERE sa.status = 'P') as present_days,
  ROUND((COUNT(*) FILTER (WHERE sa.status = 'P')::float / NULLIF(COUNT(*) FILTER (WHERE sa.status IN ('P', 'A')), 0)) * 100, 1) as calculated_percentage,
  sa2.percentage as scholarship_percentage,
  CASE 
    WHEN ABS((COUNT(*) FILTER (WHERE sa.status = 'P')::float / NULLIF(COUNT(*) FILTER (WHERE sa.status IN ('P', 'A')), 0)) * 100 - sa2.percentage) > 0.5 
    THEN 'MISMATCH ⚠️'
    ELSE 'OK ✓'
  END as status
FROM student_attendance sa
INNER JOIN students s ON s.id = sa.student_id
INNER JOIN admission_meta am ON am.entry_number = s.student_id
LEFT JOIN scholarship_attendance sa2 ON sa2.admission_id = am.id 
  AND sa2.month = sa.month 
  AND sa2.year = sa.year::text
WHERE sa.month = 'June' AND sa.year = 2026
GROUP BY s.id, s.name, sa2.month, sa2.year, sa2.percentage
ORDER BY status DESC, s.name;
