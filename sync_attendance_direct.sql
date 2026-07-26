-- Direct SQL query to sync scholarship_attendance from student_attendance
-- This uses entry_number to link admission_meta → students → student_attendance

UPDATE scholarship_attendance sa
SET
  total_days = COALESCE(daily_stats.total_days, 0),
  present_days = COALESCE(daily_stats.present_days, 0),
  percentage = CASE 
    WHEN COALESCE(daily_stats.total_days, 0) > 0 
    THEN (COALESCE(daily_stats.present_days, 0)::float / COALESCE(daily_stats.total_days, 0)) * 100
    ELSE 0
  END
FROM (
  SELECT
    am.id as admission_id,
    sa2.month,
    sa2.year,
    COUNT(*) FILTER (WHERE sta.status IN ('P', 'A')) AS total_days,
    COUNT(*) FILTER (WHERE sta.status = 'P') AS present_days
  FROM scholarship_attendance sa2
  INNER JOIN admission_meta am ON am.id = sa2.admission_id
  INNER JOIN students s ON s.student_id = am.entry_number
  LEFT JOIN student_attendance sta ON sta.student_id = s.id
    AND sta.month = sa2.month
    AND sta.year = CAST(sa2.year AS INTEGER)
  GROUP BY am.id, sa2.month, sa2.year
) AS daily_stats
WHERE sa.admission_id = daily_stats.admission_id
  AND sa.month = daily_stats.month
  AND sa.year = daily_stats.year;

-- Verify the update
SELECT 
  COUNT(*) as total_updated,
  COUNT(CASE WHEN percentage > 0 THEN 1 END) as records_with_data,
  COUNT(CASE WHEN percentage = 0 THEN 1 END) as records_with_zero,
  ROUND(AVG(percentage)::numeric, 2) as avg_percentage,
  MIN(percentage) as min_percentage,
  MAX(percentage) as max_percentage
FROM scholarship_attendance
WHERE year = '2026';
