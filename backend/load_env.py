"""
Load environment variables from .env file.
Create a .env file in the same directory as this script with your variables.
"""

import os
from pathlib import Path

def load_env():
    """Load environment variables from .env file."""
    env_path = Path(__file__).parent / '.env'
    
    if not env_path.exists():
        env_path = Path(__file__).parent.parent / '.env'
    
    if not env_path.exists():
        print("Warning: .env file not found. Using existing environment variables.")
        return
    
    print(f"Loading environment variables from {env_path}")
    
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            key, value = line.split('=', 1)
            os.environ[key.strip()] = value.strip()
    
    print("Environment variables loaded successfully.")

if __name__ == "__main__":
    load_env()
    
    # For testing purposes, print some of the loaded variables (redacted for security)
    print("SUPABASE_URL:", os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")[:10] + "..." if os.environ.get("NEXT_PUBLIC_SUPABASE_URL") else "Not set")
    print("OPENAI_API_KEY:", "****" if os.environ.get("OPENAI_API_KEY") else "Not set") 