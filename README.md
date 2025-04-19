# Piazza-Sucks-U6

A Next.js application with a Flask backend for course content management and Q&A using Supabase and OpenAI embeddings.

## Setup

### Prerequisites

- Node.js 18+ and npm/pnpm
- Python 3.7+
- Supabase account with a project set up
- OpenAI API key

### Environment Setup

1. Create a `.env` file in the root directory with the following variables:

```
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_ANON_PUBLIC=your_supabase_anon_key
SUPABASE_SERVICE_ROLE=your_supabase_service_key
SUPABASE_HOST=your_supabase_db_host
SUPABASE_DATABASE=your_supabase_db_name
SUPABASE_USER=your_supabase_db_user
SUPABASE_PASSWORD=your_supabase_db_password
```

### Frontend Setup

1. Install dependencies:
```
npm install
# or
pnpm install
```

### Backend Setup

1. Install Python dependencies:
```
cd backend
pip install -r requirements.txt
```

## Running the Application

### Option 1: Run frontend and backend separately

**Frontend**:
```
npm run dev
# or
pnpm dev
```

**Backend**:
```
cd backend
python app.py
```

### Option 2: Run both with the convenience script

```
chmod +x run_dev.sh
./run_dev.sh
```

## Accessing the Application

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## Features

- Professor dashboard for course management
- Student dashboard for enrolled courses
- Course material uploads and processing
- AI-powered Q&A based on course materials
- Vector embeddings for semantic search

## Database Setup

The backend will automatically create the necessary tables and functions when you run the Supabase setup endpoint:

```
POST /api/setup-supabase
```

## Vector Store Setup

The pgvector extension and related tables will be set up when you run the vector store setup endpoint:

```
POST /api/setup-vector-store
```