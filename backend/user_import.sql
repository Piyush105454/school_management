
-- SQL for Neon Editor (PostgreSQL)
-- IMPORTANT: Run these ALL TOGETHER

INSERT INTO users_user (
    password, is_superuser, first_name, last_name, is_staff, is_active, date_joined, email, role, phone
) VALUES 
(
    'pbkdf2_sha256$1200000$RJnLWmZHq40vfUOwzm205P$IF02FHGf7FYCpnEruBRm9uRd6b42Hsupp7TSSgVO/VA=', true, 'Admin', 'User', true, true, '2026-03-12 07:23:55', 'admin@example.com', 'OFFICE', ''
),
(
    'pbkdf2_sha256$1200000$KuEQAHCp3QNJMeEJGyA3Bm$AFQQ5hRPFpH8mv/99rmzwfWWObMuVUy8IIFfrB1Y2lY=', false, 'Student', 'User', false, true, '2026-03-12 07:23:55', 'student@example.com', 'STUDENT_PARENT', ''
);
