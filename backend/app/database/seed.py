import random
from datetime import datetime, date, timedelta
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.academic import Class, Section, AcademicYear
from app.models.attendance import Attendance
from app.models.teacher_assignment import TeacherAssignment
from app.models.holiday import Holiday
from app.models.school_settings import SchoolSettings

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def seed_database(db: Session):
    print("Starting database seeding...")

    # 1. Admin user
    admin_user = db.query(User).filter(User.username == 'admin').first()
    if not admin_user:
        print("  Creating admin user...")
        admin_user = User(
            username='admin',
            email='admin@school.com',
            password_hash=get_password_hash('admin123'),
            role='admin',
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
    else:
        print("  Admin user already exists. Skipping.")

    # 2. Academic Year
    year = db.query(AcademicYear).filter(AcademicYear.name == '2026-2027').first()
    if not year:
        print("  Creating academic year 2026-2027...")
        year = AcademicYear(
            name='2026-2027',
            start_date=date(2026, 4, 1),
            end_date=date(2027, 3, 31),
            is_active=True
        )
        db.add(year)
        db.commit()
        db.refresh(year)

    # 3. Classes and Sections
    print("  Setting up classes and sections...")
    classes = {}
    for i in range(1, 13):
        class_obj = db.query(Class).filter(
            Class.name == f'Class {i}',
            Class.academic_year_id == year.id
        ).first()
        if not class_obj:
            class_obj = Class(name=f'Class {i}', academic_year_id=year.id)
            db.add(class_obj)
            db.flush()
        classes[i] = class_obj

        for sec_name in ['A', 'B', 'C']:
            section_obj = db.query(Section).filter(
                Section.name == sec_name,
                Section.class_id == class_obj.id
            ).first()
            if not section_obj:
                section_obj = Section(name=sec_name, class_id=class_obj.id)
                db.add(section_obj)
    db.commit()

    # Helper to get a section object
    def get_section(cls_num: int, sec_name: str) -> Section:
        cls_obj = classes[cls_num]
        return db.query(Section).filter_by(name=sec_name, class_id=cls_obj.id).first()

    # 4. Teachers
    teacher_data = [
        ("Rajesh Kumar", "TCH001", "rajesh@school.com", "9876543210"),
        ("Priya Sharma", "TCH002", "priya@school.com", "9876543211"),
        ("Amit Singh", "TCH003", "amit@school.com", "9876543212"),
        ("Neha Gupta", "TCH004", "neha@school.com", "9876543213"),
        ("Suresh Patel", "TCH005", "suresh@school.com", "9876543214"),
    ]

    teachers = []
    print("  Creating teachers...")
    for name, t_id, email, phone in teacher_data:
        teacher = db.query(Teacher).filter(Teacher.teacher_id == t_id).first()
        if not teacher:
            # Create user account for teacher
            user = User(
                username=email.split('@')[0],
                email=email,
                password_hash=get_password_hash('teacher123'),
                role='teacher',
                is_active=True
            )
            db.add(user)
            db.flush()

            teacher = Teacher(
                teacher_id=t_id,
                name=name,
                email=email,
                phone=phone,
                user_id=user.id,
                status='active'
            )
            db.add(teacher)
            db.flush()
        teachers.append(teacher)
    db.commit()

    # Refresh teachers to get IDs
    for i, t in enumerate(teachers):
        db.refresh(t)
        teachers[i] = t

    # 5. Teacher Assignments
    sec_10A = get_section(10, 'A')
    sec_10B = get_section(10, 'B')
    sec_9A = get_section(9, 'A')
    sec_9B = get_section(9, 'B')
    sec_8A = get_section(8, 'A')

    assignment_map = [
        (teachers[0], classes[10], sec_10A),
        (teachers[1], classes[10], sec_10B),
        (teachers[2], classes[9], sec_9A),
        (teachers[3], classes[9], sec_9B),
        (teachers[4], classes[8], sec_8A),
    ]

    print("  Assigning teachers to sections...")
    for teacher, cls_obj, sec_obj in assignment_map:
        ta = db.query(TeacherAssignment).filter_by(
            teacher_id=teacher.id,
            class_id=cls_obj.id,
            section_id=sec_obj.id,
            academic_year_id=year.id
        ).first()
        if not ta:
            ta = TeacherAssignment(
                teacher_id=teacher.id,
                class_id=cls_obj.id,
                section_id=sec_obj.id,
                academic_year_id=year.id
            )
            db.add(ta)
    db.commit()

    # 6. Students
    indian_names = [
        "Aarav Mehta", "Vivaan Joshi", "Aditya Patel", "Vihaan Iyer",
        "Arjun Reddy", "Sai Krishna", "Ayaan Khan", "Krishna Rao",
        "Ishaan Nair", "Shaurya Singh", "Ananya Sharma", "Diya Desai",
        "Myra Gupta", "Pari Das", "Anika Chatterjee", "Riya Bose",
        "Aarohi Nandi", "Kavya Menon", "Avni Pillai", "Saanvi Bhatt",
        "Arnav Kapoor", "Dhruv Malik", "Kabir Sen", "Ahaan Verma",
        "Om Varma", "Aditi Jain", "Kiara Yadav", "Prisha Jha",
        "Roshni Thakur", "Suhana Mishra", "Rishi Goswami", "Tara Mukherjee"
    ]

    genders = ['Male', 'Female']
    student_distribution = [
        (classes[10], sec_10A, 8),
        (classes[10], sec_10B, 7),
        (classes[9], sec_9A, 6),
        (classes[9], sec_9B, 6),
        (classes[8], sec_8A, 5),
    ]

    print("  Creating students...")
    all_students = []
    stu_idx = 1
    name_idx = 0

    for cls_obj, sec_obj, count in student_distribution:
        for roll in range(1, count + 1):
            stu_id = f"STU{stu_idx:03d}"
            adm_no = f"ADM2026{stu_idx:03d}"

            student = db.query(Student).filter_by(student_id=stu_id).first()
            if not student:
                full_name = indian_names[name_idx % len(indian_names)]
                student = Student(
                    student_id=stu_id,
                    admission_number=adm_no,
                    name=full_name,
                    date_of_birth=date(2010 + random.randint(0, 4), random.randint(1, 12), random.randint(1, 28)),
                    gender=random.choice(genders),
                    class_id=cls_obj.id,
                    section_id=sec_obj.id,
                    roll_number=str(roll),
                    father_name=f"Mr. {full_name.split()[-1]}",
                    mother_name=f"Mrs. {full_name.split()[-1]}",
                    parent_phone=f"98{random.randint(10000000, 99999999)}",
                    address=f"{random.randint(1, 500)}, Sector {random.randint(1, 50)}, New Delhi",
                    admission_date=date(2026, 4, 1),
                    status='active'
                )
                db.add(student)

            all_students.append(student)
            name_idx += 1
            stu_idx += 1
    db.commit()

    # Refresh students to get IDs
    for i, s in enumerate(all_students):
        db.refresh(s)
        all_students[i] = s

    # 7. Sample attendance for last 5 working days
    print("  Generating sample attendance...")
    today = date.today()
    working_days = []
    current_day = today
    while len(working_days) < 5:
        if current_day.weekday() < 5:  # Mon-Fri
            working_days.append(current_day)
        current_day -= timedelta(days=1)

    # Build teacher lookup for sections
    teacher_for_section = {}
    for teacher, cls_obj, sec_obj in assignment_map:
        teacher_for_section[sec_obj.id] = teacher.id

    for d in working_days:
        for student in all_students:
            att = db.query(Attendance).filter_by(
                student_id=student.id, date=d
            ).first()
            if not att:
                status_choices = ['PRESENT'] * 80 + ['ABSENT'] * 10 + ['LATE'] * 7 + ['LEAVE'] * 3
                status = random.choice(status_choices)
                att = Attendance(
                    student_id=student.id,
                    teacher_id=teacher_for_section.get(student.section_id),
                    class_id=student.class_id,
                    section_id=student.section_id,
                    date=d,
                    status=status
                )
                db.add(att)
    db.commit()

    # 8. Holidays
    print("  Creating holidays...")
    holidays_data = [
        ("Republic Day", date(2027, 1, 26), "National holiday"),
        ("Holi", date(2027, 3, 14), "Festival of colors"),
        ("Independence Day", date(2026, 8, 15), "National holiday"),
        ("Gandhi Jayanti", date(2026, 10, 2), "Birth anniversary of Mahatma Gandhi"),
        ("Diwali", date(2026, 10, 21), "Festival of lights"),
        ("Christmas", date(2026, 12, 25), "Christmas Day"),
    ]

    for h_name, h_date, h_desc in holidays_data:
        hol = db.query(Holiday).filter_by(date=h_date).first()
        if not hol:
            hol = Holiday(name=h_name, date=h_date, description=h_desc)
            db.add(hol)
    db.commit()

    # 9. School Settings
    print("  Applying school settings...")
    settings = db.query(SchoolSettings).first()
    if not settings:
        settings = SchoolSettings(
            school_name="Delhi Public School",
            address="Mathura Road, New Delhi - 110003",
            phone="011-26831226",
            email="info@dps.edu.in",
            attendance_threshold=75.0,
            academic_year_id=year.id
        )
        db.add(settings)
        db.commit()

    # Print summary
    total_students = db.query(Student).count()
    total_teachers = db.query(Teacher).count()
    total_classes = db.query(Class).count()
    total_sections = db.query(Section).count()
    total_attendance = db.query(Attendance).count()
    total_holidays = db.query(Holiday).count()

    print("\n  === Seed Summary ===")
    print(f"  Users:       {db.query(User).count()}")
    print(f"  Teachers:    {total_teachers}")
    print(f"  Students:    {total_students}")
    print(f"  Classes:     {total_classes}")
    print(f"  Sections:    {total_sections}")
    print(f"  Attendance:  {total_attendance}")
    print(f"  Holidays:    {total_holidays}")
    print("  Seeding complete!")
