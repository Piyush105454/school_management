import os
import django
from django.contrib.auth.hashers import make_password
from django.utils import timezone

# Configure Django settings for standalone use
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def generate_sql():
    # Admin User
    admin_email = "admin@example.com"
    admin_pass = "admin123"
    admin_hash = make_password(admin_pass)
    
    # Student User
    student_email = "student@example.com"
    student_pass = "student123"
    student_hash = make_password(student_pass)
    
    now = timezone.now().strftime('%Y-%m-%d %H:%M:%S')

    sql = f"""
-- SQL for Neon Editor (PostgreSQL)
-- IMPORTANT: Run these ALL TOGETHER

INSERT INTO users_user (
    password, is_superuser, first_name, last_name, is_staff, is_active, date_joined, email, role, phone
) VALUES 
(
    '{admin_hash}', true, 'Admin', 'User', true, true, '{now}', '{admin_email}', 'OFFICE', ''
),
(
    '{student_hash}', false, 'Student', 'User', false, true, '{now}', '{student_email}', 'STUDENT_PARENT', ''
);
"""
    with open('backend/user_import.sql', 'w') as f:
        f.write(sql)
    print("SQL generated in backend/user_import.sql")

if __name__ == "__main__":
    generate_sql()
