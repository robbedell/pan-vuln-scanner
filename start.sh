#!/bin/sh

# Simple process manager to auto-restart Next.js if it exits.
# This allows the /api/update endpoint to call process.exit(0) and let the container restart the app.

echo "Starting Application Manager..."

# Default port if not set
PORT="${PORT:-9966}"

while true; do
  echo "Starting Next.js on port $PORT..."
  npx next start -p $PORT
  EXIT_CODE=$?
  
  echo "Next.js exited with code $EXIT_CODE. Restarting in 2 seconds..."
  sleep 2
done
