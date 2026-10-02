import sys
import os

# ============================================================
# Ensure backend directory is in Python path
# ============================================================
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


# ============================================================
# Initialize database
# ============================================================
from app.database.init_db import init_db
from app.database.session import SessionLocal
from app.database.seed import seed_database


def main():
    print("=" * 60)
    print("SCHOOL ATTENDANCE SYSTEM - DATABASE INITIALIZATION")
    print("=" * 60)

    # --------------------------------------------------------
    # Step 1: Create database tables
    # --------------------------------------------------------
    print("\n[1/2] Initializing database...")

    try:
        init_db()
        print("Database tables created successfully.")

    except Exception as e:
        print(f"ERROR: Database initialization failed: {e}")
        sys.exit(1)

    # --------------------------------------------------------
    # Step 2: Seed database
    # --------------------------------------------------------
    print("\n[2/2] Starting database seeding...")

    db = SessionLocal()

    try:
        seed_database(db)

        print("\nDatabase initialized and seeded successfully.")

    except Exception as e:
        print(f"\nERROR during database seeding: {e}")

        try:
            db.rollback()
            print("Database transaction rolled back.")
        except Exception as rollback_error:
            print(f"Rollback failed: {rollback_error}")

        # Do not stop the Render server because of a seeding
        # error. The FastAPI application can still start.
        print("Continuing with application startup...")

    finally:
        db.close()
        print("Database connection closed.")

    print("=" * 60)


if __name__ == "__main__":
    main()