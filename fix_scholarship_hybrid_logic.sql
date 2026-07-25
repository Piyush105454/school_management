-- ============================================================================
-- Recalculate JUNE Scholarship Records with Hybrid Logic
-- ============================================================================
-- 
-- LOGIC:
-- - If percentage >= threshold: Full amount (₹750)
-- - If percentage < threshold: Proportional amount (percentage × ₹750 / 100)
--
-- Example:
-- - 90% homework >= 90% threshold = ₹750 (full)
-- - 85% homework < 90% threshold = ₹637.50 (proportional)
-- ============================================================================

-- Step 1: Update scholarship_records with recalculated amounts (JUNE ONLY)
UPDATE scholarship_records sr
SET 
  -- Attendance Amount: Full if >= threshold, proportional if below
  attendance_amount = CASE 
    WHEN sa.percentage >= scs.attendance_threshold THEN scs.attendance_amount
    ELSE ROUND((sa.percentage / 100.0) * scs.attendance_amount)::integer
  END,
  
  -- Homework Amount: Full if >= threshold, proportional if below
  homework_amount = CASE 
    WHEN sh.percentage >= scs.homework_threshold THEN scs.homework_amount
    ELSE ROUND((sh.percentage / 100.0) * scs.homework_amount)::integer
  END,
  
  -- Guardian Amount: Full if rating >= threshold, otherwise ₹0
  guardian_amount = CASE 
    WHEN sg.rating >= scs.guardian_rating_threshold THEN scs.guardian_amount
    ELSE 0
  END,
  
  -- PTM Amount: Full if attended, otherwise ₹0
  ptm_amount = CASE 
    WHEN sp.attended = true THEN scs.ptm_amount
    ELSE 0
  END,
  
  -- Total Amount: Sum of all components
  total_amount = (
    -- Attendance
    CASE 
      WHEN sa.percentage >= scs.attendance_threshold THEN scs.attendance_amount
      ELSE ROUND((sa.percentage / 100.0) * scs.attendance_amount)::integer
    END
    +
    -- Homework
    CASE 
      WHEN sh.percentage >= scs.homework_threshold THEN scs.homework_amount
      ELSE ROUND((sh.percentage / 100.0) * scs.homework_amount)::integer
    END
    +
    -- Guardian
    CASE 
      WHEN sg.rating >= scs.guardian_rating_threshold THEN scs.guardian_amount
      ELSE 0
    END
    +
    -- PTM
    CASE 
      WHEN sp.attended = true THEN scs.ptm_amount
      ELSE 0
    END
    +
    -- Adjustments
    COALESCE(sr.adjustment_amount, 0)
    -
    COALESCE(sr.discount_amount, 0)
    +
    COALESCE(sr.additional_charge_amount, 0)
  ),
  
  updated_at = NOW()

FROM 
  scholarship_attendance sa
  INNER JOIN scholarship_homework sh ON sa.admission_id = sh.admission_id 
    AND sa.month = sh.month 
    AND sa.year = sh.year
  LEFT JOIN scholarship_guardian sg ON sa.admission_id = sg.admission_id 
    AND sa.month = sg.month 
    AND sa.year = sg.year
  LEFT JOIN scholarship_ptm sp ON sa.admission_id = sp.admission_id 
    AND sa.month = sp.month 
    AND sa.year = sp.year
  LEFT JOIN scholarship_criteria_settings scs ON (
    (scs.admission_id = sa.admission_id OR scs.admission_id IS NULL)
    AND scs.academic_year = '2025-26'
  )

WHERE 
  sr.admission_id = sa.admission_id
  AND sr.month = sa.month
  AND sr.year = sa.year
  AND sr.month = 'June'  -- ONLY JUNE RECORDS
  -- Prioritize student-specific criteria, fallback to global
  AND scs.id = (
    SELECT id FROM scholarship_criteria_settings
    WHERE (admission_id = sa.admission_id OR admission_id IS NULL)
      AND academic_year = '2025-26'
    ORDER BY admission_id NULLS LAST
    LIMIT 1
  );

-- ============================================================================
-- Step 2: Verification Query - Show all updated records
-- ============================================================================

SELECT 
  am.scholar_number AS "Scholar No",
  sb.first_name || ' ' || sb.last_name AS "Student Name",
  sr.month AS "Month",
  sr.year AS "Year",
  
  -- Attendance
  CAST(sa.percentage AS numeric(5,1)) AS "Att %",
  sr.attendance_amount AS "Att ₹",
  
  -- Homework
  CAST(sh.percentage AS numeric(5,1)) AS "HW %",
  sr.homework_amount AS "HW ₹",
  
  -- Guardian
  COALESCE(sg.rating, 0) AS "Grd Rating",
  sr.guardian_amount AS "Grd ₹",
  
  -- PTM
  CASE WHEN sp.attended THEN 'Yes' ELSE 'No' END AS "PTM",
  sr.ptm_amount AS "PTM ₹",
  
  -- Total
  sr.total_amount AS "Total ₹",
  sr.status AS "Status",
  sr.updated_at AS "Last Updated"

FROM 
  scholarship_records sr
  INNER JOIN admission_meta am ON sr.admission_id = am.id
  INNER JOIN student_bio sb ON am.id = sb.admission_id
  LEFT JOIN scholarship_attendance sa ON sr.admission_id = sa.admission_id 
    AND sr.month = sa.month 
    AND sr.year = sa.year
  LEFT JOIN scholarship_homework sh ON sr.admission_id = sh.admission_id 
    AND sr.month = sh.month 
    AND sr.year = sh.year
  LEFT JOIN scholarship_guardian sg ON sr.admission_id = sg.admission_id 
    AND sr.month = sg.month 
    AND sr.year = sg.year
  LEFT JOIN scholarship_ptm sp ON sr.admission_id = sp.admission_id 
    AND sr.month = sp.month 
    AND sr.year = sp.year

WHERE sr.month = 'June'  -- ONLY JUNE RECORDS

ORDER BY 
  am.scholar_number ASC;

-- ============================================================================
-- Step 3: Summary Statistics (JUNE ONLY)
-- ============================================================================

SELECT 
  'June' AS "Month",
  COUNT(*) AS "Total Records Updated",
  COUNT(DISTINCT sr.admission_id) AS "Total Students",
  SUM(sr.total_amount) AS "Total Scholarship Amount",
  AVG(sr.total_amount)::integer AS "Average Scholarship Per Record",
  MAX(sr.updated_at) AS "Last Update Time"
FROM scholarship_records sr
WHERE sr.month = 'June';

-- ============================================================================
-- Done! All June scholarship records have been recalculated.
-- ============================================================================
