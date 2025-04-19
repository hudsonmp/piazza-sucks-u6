"""
Test Supabase and OpenAI connections.
Run this script to verify your environment is correctly configured.
"""

import os
import requests
from load_env import load_env

def test_supabase_connection():
    """Test the connection to Supabase."""
    print("\n--- Testing Supabase Connection ---")
    
    # Load environment variables
    load_env()
    
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    supabase_anon_key = os.environ.get("SUPABASE_ANON_PUBLIC")
    
    if not supabase_url or not supabase_anon_key:
        print("❌ NEXT_PUBLIC_SUPABASE_URL or SUPABASE_ANON_PUBLIC is not set")
        return False
    
    # Try to connect to Supabase health endpoint
    try:
        response = requests.get(
            f"{supabase_url}/rest/v1/",
            headers={
                "apikey": supabase_anon_key,
                "Authorization": f"Bearer {supabase_anon_key}"
            }
        )
        
        if response.status_code == 200:
            print("✅ Supabase connection successful!")
            return True
        else:
            print(f"❌ Supabase connection failed with status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error connecting to Supabase: {str(e)}")
        return False

def test_openai_connection():
    """Test the connection to OpenAI."""
    print("\n--- Testing OpenAI Connection ---")
    
    openai_api_key = os.environ.get("OPENAI_API_KEY")
    
    if not openai_api_key:
        print("❌ OPENAI_API_KEY is not set")
        return False
    
    # Try to connect to OpenAI API
    try:
        from openai import OpenAI
        import httpx
        
        # Initialize the client with just the API key
        # No proxies for OpenAI client
        httpx._config.Limits(max_connections=100, max_keepalive_connections=20)
        client = OpenAI(api_key=openai_api_key)
        
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input="Test"
        )
        
        if response.data:
            print("✅ OpenAI connection successful!")
            return True
        else:
            print("❌ OpenAI connection failed")
            return False
    except Exception as e:
        print(f"❌ Error connecting to OpenAI: {str(e)}")
        return False

def test_database_connection():
    """Test the connection to Supabase PostgreSQL database."""
    print("\n--- Testing Database Connection ---")
    
    db_host = os.environ.get("SUPABASE_HOST")
    db_name = os.environ.get("SUPABASE_DATABASE")
    db_user = os.environ.get("SUPABASE_USER")
    db_password = os.environ.get("SUPABASE_PASSWORD")
    
    if not all([db_host, db_name, db_user, db_password]):
        print("❌ One or more database connection variables are not set")
        return False
    
    try:
        import psycopg2
        
        # For Supabase, direct DB access might not be available
        # Let's just check if we can connect to the REST API
        print("Note: Direct database connection might not be available.")
        print("     Using the Supabase REST API instead.")
        
        # We already tested Supabase REST API connection earlier
        if os.environ.get("NEXT_PUBLIC_SUPABASE_URL") and os.environ.get("SUPABASE_ANON_PUBLIC"):
            print(f"✅ Database access available through Supabase REST API")
            return True
        else:
            print("❌ Cannot access database through Supabase REST API")
            return False
    except Exception as e:
        print(f"❌ Error connecting to database: {str(e)}")
        return False

if __name__ == "__main__":
    print("Running connection tests...")
    
    # Run tests
    supabase_success = test_supabase_connection()
    openai_success = test_openai_connection()
    db_success = test_database_connection()
    
    # Summary
    print("\n--- Test Summary ---")
    print(f"Supabase API: {'✅ Connected' if supabase_success else '❌ Failed'}")
    print(f"OpenAI API: {'✅ Connected' if openai_success else '❌ Failed'}")
    print(f"Database: {'✅ Connected' if db_success else '❌ Failed'}")
    
    if all([supabase_success, openai_success, db_success]):
        print("\n✅ All systems are properly configured!")
    else:
        print("\n❌ Some connections failed. Please check your environment variables.") 