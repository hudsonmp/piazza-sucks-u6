#!/bin/bash

echo "Setting up Piazza-Sucks-U6 application..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js 18+ before continuing."
    exit 1
fi

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3.7+ before continuing."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# OpenAI
OPENAI_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_ANON_PUBLIC=
SUPABASE_SERVICE_ROLE=
SUPABASE_HOST=
SUPABASE_DATABASE=
SUPABASE_USER=
SUPABASE_PASSWORD=
EOF
    echo ".env file created. Please edit it with your API keys and Supabase credentials."
else
    echo ".env file already exists."
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install || pnpm install

# Install backend dependencies
echo "Setting up backend..."
cd backend
pip3 install -r requirements.txt

# Make the run script executable
cd ..
chmod +x run_dev.sh

echo "Setup complete!"
echo "Please ensure your .env file is filled with the required credentials."
echo "To run the application, use: ./run_dev.sh" 