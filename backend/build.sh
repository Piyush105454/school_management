#!/usr/bin/env bash
# exit on error
set -o errexit

# Move into the backend directory if it exists (handles different Render root directory settings)
if [ -d "backend" ]; then
    cd backend
fi

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# Create initial admin user (Temporarily)
python create_admin.py
