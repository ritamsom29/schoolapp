import sys
import os

# Ensure backend directory is in path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.init_db import init_db
from app.database.session import SessionLocal
from app.database.seed import seed_database

def main():
    print("Initializing database...")
    init_db()
    
    print("Starting seeding process...")
    db = SessionLocal()
    try:
        seed_database(db)
        print("Database initialized and seeded successfully.")
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
