import io
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from datetime import datetime

def generate_pdf_report(report_data: dict, school_info: dict) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30,
    )
    elements = []
    styles = getSampleStyleSheet()

    # School Header
    school_name = school_info.get("school_name", "School Attendance System")
    address = school_info.get("address", "")
    phone = school_info.get("phone", "")
    email = school_info.get("email", "")

    header_style = ParagraphStyle(
        'HeaderTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        alignment=1,
        textColor=colors.HexColor('#1e1b4b'),
    )
    elements.append(Paragraph(school_name, header_style))

    sub_style = ParagraphStyle(
        'HeaderSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        alignment=1,
        textColor=colors.HexColor('#475569'),
    )
    elements.append(Paragraph(f"{address} | Phone: {phone} | Email: {email}", sub_style))
    elements.append(Spacer(1, 10))

    # Report Title Banner
    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        alignment=1,
        textColor=colors.HexColor('#4338ca'),
    )
    title_text = f"MONTHLY ATTENDANCE REPORT — {report_data['month_name'].upper()} {report_data['year']}"
    elements.append(Paragraph(title_text, title_style))

    info_text = f"Class: {report_data['class_name']} - Section {report_data['section_name']} | Working Days: {report_data['total_working_days']} | Attendance Threshold: {report_data['threshold']}%"
    elements.append(Paragraph(info_text, sub_style))
    elements.append(Spacer(1, 15))

    # Table of Students
    table_data = [
        ["Roll", "Student ID", "Admission No", "Student Name", "Working Days", "Present", "Absent", "Leave", "Late", "Attendance %"]
    ]

    for s in report_data["students"]:
        table_data.append([
            s["roll_number"] or "—",
            s["student_code"],
            s["admission_number"],
            s["student_name"],
            str(s["working_days"]),
            str(s["present"]),
            str(s["absent"]),
            str(s["leave"]),
            str(s["late"]),
            f"{s['percentage']}%",
        ])

    table = Table(table_data, repeatRows=1)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4f46e5')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (3, 1), (3, -1), 'LEFT'),  # Student name left-aligned
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 15))

    # Footer Statistics
    footer_text = f"<b>Total Students:</b> {len(report_data['students'])} | <b>Class Average:</b> {report_data['average_attendance']}% | <b>Low Attendance (&lt;{report_data['threshold']}%):</b> {report_data['low_attendance_count']} students<br/>"
    footer_text += f"<i>Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | Official School Document</i>"
    elements.append(Paragraph(footer_text, sub_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer
