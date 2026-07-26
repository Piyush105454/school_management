-- Sync Scholarship Attendance Percentages from Student Attendance
-- This query recalculates all scholarship attendance percentages based on actual student attendance

UPDATE scholarship_attendance AS sa
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
    admission_id,
    month,
    year,
    COUNT(*) FILTER (WHERE status IN ('P', 'A')) AS total_days,
    COUNT(*) FILTER (WHERE status = 'P') AS present_days
  FROM student_attendance
  WHERE status IN ('P', 'A')  -- Only count Present and Absent (exclude holidays, NA, etc)
  GROUP BY admission_id, month, year
) AS daily_stats
WHERE sa.admission_id = daily_stats.admission_id
  AND sa.month = daily_stats.month
  AND sa.year = daily_stats.year;

-- Verify the update
SELECT 
  sa.admission_id,
  sa.month,
  sa.year,
  sa.total_days,
  sa.present_days,
  ROUND(sa.percentage, 2) as percentage,
  COUNT(std.id) as actual_record_count
FROM scholarship_attendance sa
LEFT JOIN student_attendance std ON 
  std.admission_id = sa.admission_id 
  AND std.month = sa.month 
  AND std.year = sa.year
GROUP BY sa.id, sa.admission_id, sa.month, sa.year, sa.total_days, sa.present_days, sa.percentage
ORDER BY sa.year DESC, sa.month DESC
LIMIT 10;
