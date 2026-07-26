-- MASTER ATTENDANCE SYNC
-- Keeps all three views in perfect sync:
-- 1. Daily Registration (Admin marks attendance)
-- 2. Class Attendance Grid (Shows all students)
-- 3. Student Attendance Calendar (Student views their own)

-- ONE-TIME SYNC: Update scholarship_attendance from current student_attendance data
UPDATE scholarship_attendance sa
SET
  total_days = COALESCE(daily_stats.total_days, 0),
  present_days = COALESCE(daily_stats.present_days, 0),
  percentage = CASE 
    WHEN COALESCE(daily_stats.total_days, 0) > 0 
    THEN (COALESCE(daily_stats.present_days, 0)::float / COALESCE(daily_stats.total_days, 0)) * 100
    ELSE 0
  END,
  created_at = NOW()
FROM (
  SELECT
    am.id as admission_id,
    sa2.month,
    sa2.year,
    COUNT(*) FILTER (WHERE std_att.status IN ('P', 'A')) AS total_days,
    COUNT(*) FILTER (WHERE std_att.status = 'P') AS present_days
  FROM scholarship_attendance sa2
  INNER JOIN admission_meta am ON am.id = sa2.admission_id
  INNER JOIN students s ON s.student_id = am.entry_number
  LEFT JOIN student_attendance std_att ON std_att.student_id = s.id
    AND std_att.month = sa2.month
    AND CAST(std_att.year AS TEXT) = sa2.year
  GROUP BY am.id, sa2.month, sa2.year
) AS daily_stats
WHERE sa.admission_id = daily_stats.admission_id
  AND sa.month = daily_stats.month
  AND sa.year = daily_stats.year;

-- VERIFICATION: Show final synced state
SELECT 
  'SYNC COMPLETE ✓' as status,
  COUNT(DISTINCT sa.id) as total_scholarship_records,
  COUNT(DISTINCT std_att.id) as total_attendance_records,
  ROUND(AVG(sa.percentage)::numeric, 1) as avg_attendance_pct
FROM scholarship_attendance sa
LEFT JOIN admission_meta am ON am.id = sa.admission_id
LEFT JOIN students s ON s.student_id = am.entry_number
LEFT JOIN student_attendance std_att ON std_att.student_id = s.id
  AND std_att.month = sa.month
  AND CAST(std_att.year AS TEXT) = sa.year;

-- Show sample of synced data
SELECT 
  s.name,
  am.entry_number,
  sa.month,
  sa.year,
  sa.total_days,
  sa.present_days,
  ROUND(sa.percentage::numeric, 1) as percentage,
  COUNT(std_att.id) as actual_records
FROM scholarship_attendance sa
INNER JOIN admission_meta am ON am.id = sa.admission_id
INNER JOIN students s ON s.student_id = am.entry_number
LEFT JOIN student_attendance std_att ON std_att.student_id = s.id
  AND std_att.month = sa.month
  AND CAST(std_att.year AS TEXT) = sa.year
  AND std_att.status IN ('P', 'A')
GROUP BY s.id, s.name, am.entry_number, sa.id, sa.month, sa.year, sa.total_days, sa.present_days, sa.percentage
ORDER BY s.name
LIMIT 20;
