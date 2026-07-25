-- Fix June 2026 scholarship amounts using correct hybrid logic
-- If percentage >= threshold (90%), award FULL amount
-- If percentage < threshold, award proportional amount

-- First, let's see what's wrong (for verification)
SELECT 
  CONCAT(sb.first_name, ' ', sb.last_name) as student_name,
  sr.month,
  sr.year,
  
  -- Attendance
  sa.percentage as att_pct,
  sr.attendance_amount as current_att_amount,
  CASE 
    WHEN sa.percentage >= 90 THEN 750
    ELSE ROUND((sa.percentage / 100) * 750)
  END as correct_att_amount,
  
  -- Homework
  sh.percentage as hw_pct,
  sr.homework_amount as current_hw_amount,
  CASE 
    WHEN sh.percentage >= 90 THEN 750
    ELSE ROUND((sh.percentage / 100) * 750)
  END as correct_hw_amount,
  
  -- Guardian
  sg.rating as guardian_rating,
  sr.guardian_amount as current_guardian_amount,
  CASE 
    WHEN sg.rating >= 4 THEN 750
    ELSE ROUND((sg.rating::numeric / 5) * 750)
  END as correct_guardian_amount,
  
  -- PTM
  sp.attended as ptm_attended,
  sr.ptm_amount as current_ptm_amount,
  CASE 
    WHEN sp.attended = true THEN 750
    ELSE 0
  END as correct_ptm_amount,
  
  sr.total_amount as current_total,
  (
    CASE WHEN sa.percentage >= 90 THEN 750 ELSE ROUND((sa.percentage / 100) * 750) END +
    CASE WHEN sh.percentage >= 90 THEN 750 ELSE ROUND((sh.percentage / 100) * 750) END +
    CASE WHEN sg.rating >= 4 THEN 750 ELSE ROUND((sg.rating::numeric / 5) * 750) END +
    CASE WHEN sp.attended = true THEN 750 ELSE 0 END
  ) as correct_total

FROM scholarship_records sr
LEFT JOIN admission_meta am ON sr.admission_id = am.id
LEFT JOIN student_bio sb ON sr.admission_id = sb.admission_id
LEFT JOIN scholarship_attendance sa ON sr.admission_id = sa.admission_id AND sr.month = sa.month AND sr.year = sa.year
LEFT JOIN scholarship_homework sh ON sr.admission_id = sh.admission_id AND sr.month = sh.month AND sr.year = sh.year
LEFT JOIN scholarship_guardian sg ON sr.admission_id = sg.admission_id AND sr.month = sg.month AND sr.year = sg.year
LEFT JOIN scholarship_ptm sp ON sr.admission_id = sp.admission_id AND sr.month = sp.month AND sr.year = sp.year
WHERE sr.month = 'June' AND sr.year = '2026'
ORDER BY sb.first_name;

-- Now FIX the records with correct hybrid logic
UPDATE scholarship_records sr
SET 
  attendance_amount = (
    SELECT CASE 
      WHEN sa.percentage >= 90 THEN 750
      ELSE ROUND((sa.percentage / 100) * 750)::integer
    END
    FROM scholarship_attendance sa
    WHERE sa.admission_id = sr.admission_id 
      AND sa.month = sr.month 
      AND sa.year = sr.year
  ),
  
  homework_amount = (
    SELECT CASE 
      WHEN sh.percentage >= 90 THEN 750
      ELSE ROUND((sh.percentage / 100) * 750)::integer
    END
    FROM scholarship_homework sh
    WHERE sh.admission_id = sr.admission_id 
      AND sh.month = sr.month 
      AND sh.year = sr.year
  ),
  
  guardian_amount = (
    SELECT CASE 
      WHEN sg.rating >= 4 THEN 750
      ELSE ROUND((sg.rating::numeric / 5) * 750)::integer
    END
    FROM scholarship_guardian sg
    WHERE sg.admission_id = sr.admission_id 
      AND sg.month = sr.month 
      AND sg.year = sr.year
  ),
  
  ptm_amount = (
    SELECT CASE 
      WHEN sp.attended = true THEN 750
      ELSE 0
    END
    FROM scholarship_ptm sp
    WHERE sp.admission_id = sr.admission_id 
      AND sp.month = sr.month 
      AND sp.year = sr.year
  ),
  
  total_amount = (
    COALESCE((
      SELECT CASE WHEN sa.percentage >= 90 THEN 750 ELSE ROUND((sa.percentage / 100) * 750)::integer END
      FROM scholarship_attendance sa
      WHERE sa.admission_id = sr.admission_id AND sa.month = sr.month AND sa.year = sr.year
    ), 0) +
    COALESCE((
      SELECT CASE WHEN sh.percentage >= 90 THEN 750 ELSE ROUND((sh.percentage / 100) * 750)::integer END
      FROM scholarship_homework sh
      WHERE sh.admission_id = sr.admission_id AND sh.month = sr.month AND sh.year = sr.year
    ), 0) +
    COALESCE((
      SELECT CASE WHEN sg.rating >= 4 THEN 750 ELSE ROUND((sg.rating::numeric / 5) * 750)::integer END
      FROM scholarship_guardian sg
      WHERE sg.admission_id = sr.admission_id AND sg.month = sr.month AND sg.year = sr.year
    ), 0) +
    COALESCE((
      SELECT CASE WHEN sp.attended = true THEN 750 ELSE 0 END
      FROM scholarship_ptm sp
      WHERE sp.admission_id = sr.admission_id AND sp.month = sr.month AND sp.year = sr.year
    ), 0)
  ),
  
  school_fee = 3000,
  
  pending_amount = GREATEST(0, 
    3000 - (
      COALESCE((
        SELECT CASE WHEN sa.percentage >= 90 THEN 750 ELSE ROUND((sa.percentage / 100) * 750)::integer END
        FROM scholarship_attendance sa
        WHERE sa.admission_id = sr.admission_id AND sa.month = sr.month AND sa.year = sr.year
      ), 0) +
      COALESCE((
        SELECT CASE WHEN sh.percentage >= 90 THEN 750 ELSE ROUND((sh.percentage / 100) * 750)::integer END
        FROM scholarship_homework sh
        WHERE sh.admission_id = sr.admission_id AND sh.month = sr.month AND sh.year = sr.year
      ), 0) +
      COALESCE((
        SELECT CASE WHEN sg.rating >= 4 THEN 750 ELSE ROUND((sg.rating::numeric / 5) * 750)::integer END
        FROM scholarship_guardian sg
        WHERE sg.admission_id = sr.admission_id AND sg.month = sr.month AND sg.year = sr.year
      ), 0) +
      COALESCE((
        SELECT CASE WHEN sp.attended = true THEN 750 ELSE 0 END
        FROM scholarship_ptm sp
        WHERE sp.admission_id = sr.admission_id AND sp.month = sr.month AND sp.year = sr.year
      ), 0)
    ) + COALESCE(sr.adjustment_amount, 0)
  )

WHERE sr.month = 'June' AND sr.year = '2026';

-- Verification: Check updated records
SELECT 
  CONCAT(sb.first_name, ' ', sb.last_name) as student_name,
  sr.month,
  
  sa.percentage as att_pct,
  sr.attendance_amount,
  
  sh.percentage as hw_pct,
  sr.homework_amount,
  
  sg.rating as guardian_rating,
  sr.guardian_amount,
  
  sp.attended as ptm_attended,
  sr.ptm_amount,
  
  sr.total_amount,
  sr.school_fee,
  sr.pending_amount

FROM scholarship_records sr
LEFT JOIN admission_meta am ON sr.admission_id = am.id
LEFT JOIN student_bio sb ON sr.admission_id = sb.admission_id
LEFT JOIN scholarship_attendance sa ON sr.admission_id = sa.admission_id AND sr.month = sa.month AND sr.year = sa.year
LEFT JOIN scholarship_homework sh ON sr.admission_id = sh.admission_id AND sr.month = sh.month AND sr.year = sh.year
LEFT JOIN scholarship_guardian sg ON sr.admission_id = sg.admission_id AND sr.month = sg.month AND sr.year = sg.year
LEFT JOIN scholarship_ptm sp ON sr.admission_id = sp.admission_id AND sr.month = sp.month AND sr.year = sp.year
WHERE sr.month = 'June' AND sr.year = '2026'
ORDER BY sb.first_name
LIMIT 20;
