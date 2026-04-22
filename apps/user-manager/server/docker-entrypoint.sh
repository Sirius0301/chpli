#!/bin/sh
set -e

# Run database push (auto-creates tables without migrations)
echo "Setting up database..."
npx prisma db push --accept-data-loss

# Start the server
echo "Starting server..."
exec node dist/index.js
