-- Create trigger to auto-update scholarship_attendance when student_attendance changes

CREATE OR REPLACE FUNCTION update_scholarship_attendance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE scholarship_attendance
  SET
    total_days = (
      SELECT COUNT(*) FILTER (WHERE status IN ('P', 'A'))
      FROM student_attendance
      WHERE admission_id = NEW.admission_id
        AND month = NEW.month
        AND year = NEW.year::text
    ),
    present_days = (
      SELECT COUNT(*) FILTER (WHERE status = 'P')
      FROM student_attendance
      WHERE admission_id = NEW.admission_id
        AND month = NEW.month
        AND year = NEW.year::text
    ),
    percentage = (
      CASE 
        WHEN (
          SELECT COUNT(*) FILTER (WHERE status IN ('P', 'A'))
          FROM student_attendance
          WHERE admission_id = NEW.admission_id
            AND month = NEW.month
            AND year = NEW.year::text
        ) > 0
        THEN (
          SELECT (COUNT(*) FILTER (WHERE status = 'P')::float / COUNT(*) FILTER (WHERE status IN ('P', 'A'))) * 100
          FROM student_attendance
          WHERE admission_id = NEW.admission_id
            AND month = NEW.month
            AND year = NEW.year::text
        )
        ELSE 0
      END
    )
  WHERE admission_id = NEW.admission_id
    AND month = NEW.month
    AND year = NEW.year::text;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_update_scholarship_attendance ON student_attendance;

-- Create trigger
CREATE TRIGGER trg_update_scholarship_attendance
AFTER INSERT OR UPDATE OR DELETE ON student_attendance
FOR EACH ROW
EXECUTE FUNCTION update_scholarship_attendance();
