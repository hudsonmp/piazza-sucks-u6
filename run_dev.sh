#!/bin/bash

# Update dependencies
echo "Installing dependencies..."

# Install correct OpenAI version
echo "Installing correct OpenAI version..."
cd backend
pip install openai==1.3.0
cd ..

# Start the Next.js frontend
echo "Starting Next.js frontend..."
npm run dev &
FRONTEND_PID=$!

# Start the Flask backend
echo "Starting Flask backend..."
cd backend
python3 app.py &
BACKEND_PID=$!

# Function to handle termination
cleanup() {
  echo "Shutting down servers..."
  kill $FRONTEND_PID
  kill $BACKEND_PID
  exit 0
}

# Trap Ctrl+C to ensure clean shutdown
trap cleanup INT

# Keep script running
wait 