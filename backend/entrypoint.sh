#!/bin/sh
set -e

export PGPASSWORD="$DB_PASSWORD"

echo "⏳ Waiting for database..."
until psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  echo "Waiting for PostgreSQL to be available..."
  sleep 2
done

echo "🚀 Running migrations..."
for file in /app/migrations/*.sql; do
  echo "Running $file"
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$file"
done

echo "🌱 Running seed data..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /app/seeds/seed_data.sql

echo "✅ Starting backend server..."
exec npm start
