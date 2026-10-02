"""
Script to create or reset a Teacher's login credentials in SQLite.
Usage:
    python create_teacher_user.py <username> <password> <email> <teacher_id> <teacher_name>
Example:
    python create_teacher_user.py meera teacher123 meera@school.com TCH008 "Meera Nambiar"
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import SessionLocal
from app.models.user import User
from app.models.teacher import Teacher
from app.auth.password import hash_password

def create_or_update_teacher(username, password, email, teacher_id, teacher_name, phone=""):
    db = SessionLocal()
    try:
        # 1. Check or create User
        user = db.query(User).filter((User.username == username) | (User.email == email)).first()
        hashed = hash_password(password)

        if user:
            print(f"Updating existing user '{user.username}'...")
            user.username = username
            user.email = email
            user.password_hash = hashed
            user.role = "teacher"
            user.is_active = True
        else:
            print(f"Creating new user '{username}'...")
            user = User(
                username=username,
                email=email,
                password_hash=hashed,
                role="teacher",
                is_active=True,
            )
            db.add(user)
            db.flush()

        # 2. Check or create Teacher
        teacher = db.query(Teacher).filter(Teacher.teacher_id == teacher_id).first()
        if teacher:
            print(f"Linking user to existing teacher '{teacher.name}' ({teacher.teacher_id})...")
            teacher.user_id = user.id
            teacher.email = email
            if phone:
                teacher.phone = phone
        else:
            print(f"Creating new teacher profile '{teacher_name}' ({teacher_id})...")
            teacher = Teacher(
                teacher_id=teacher_id,
                name=teacher_name,
                email=email,
                phone=phone,
                user_id=user.id,
                status="active",
            )
            db.add(teacher)

        db.commit()
        print("\n[SUCCESS]")
        print(f"  Username:   {user.username}")
        print(f"  Password:   {password}")
        print(f"  Teacher ID: {teacher.teacher_id}")
        print(f"  Name:       {teacher.name}")
        print(f"  Role:       {user.role}")

    except Exception as e:
        db.rollback()
        print(f"[ERROR]: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 6:
        print("Usage: python create_teacher_user.py <username> <password> <email> <teacher_id> <name> [phone]")
        print("Example: python create_teacher_user.py anita secret123 anita@school.com TCH009 \"Anita Roy\"")
    else:
        u = sys.argv[1]
        p = sys.argv[2]
        e = sys.argv[3]
        t_id = sys.argv[4]
        name = sys.argv[5]
        ph = sys.argv[6] if len(sys.argv) > 6 else ""
        create_or_update_teacher(u, p, e, t_id, name, ph)
