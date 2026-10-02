from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from app.database.session import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.academic import Class, Section, AcademicYear
from app.schemas.academic import (
    ClassResponse, ClassWithSectionsResponse, SectionResponse,
    ClassCreate, SectionCreate,
    AcademicYearCreate, AcademicYearResponse,
)

router = APIRouter(prefix="/api", tags=["Classes & Sections"])


# ── Academic Years ──────────────────────────────────────────
@router.get("/academic-years", response_model=List[AcademicYearResponse])
def list_academic_years(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(AcademicYear).order_by(AcademicYear.name.desc()).all()


@router.post("/academic-years", response_model=AcademicYearResponse, status_code=201)
def create_academic_year(
    data: AcademicYearCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    year = AcademicYear(**data.model_dump())
    db.add(year)
    db.commit()
    db.refresh(year)
    return year


# ── Classes ─────────────────────────────────────────────────
@router.get("/classes", response_model=List[ClassWithSectionsResponse])
def list_classes(
    academic_year_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Class).options(joinedload(Class.sections))
    if academic_year_id:
        query = query.filter(Class.academic_year_id == academic_year_id)
    return query.order_by(Class.name).all()


@router.post("/classes", response_model=ClassResponse, status_code=201)
def create_class(
    data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    cls = Class(**data.model_dump())
    db.add(cls)
    db.commit()
    db.refresh(cls)
    return cls


@router.put("/classes/{class_id}", response_model=ClassResponse)
def update_class(
    class_id: int,
    data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Class not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(cls, k, v)
    db.commit()
    db.refresh(cls)
    return cls


@router.delete("/classes/{class_id}")
def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Class not found")
    db.delete(cls)
    db.commit()
    return {"message": "Class deleted"}


# ── Sections ────────────────────────────────────────────────
@router.get("/sections", response_model=List[SectionResponse])
def list_sections(
    class_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Section)
    if class_id:
        query = query.filter(Section.class_id == class_id)
    return query.order_by(Section.name).all()


@router.post("/sections", response_model=SectionResponse, status_code=201)
def create_section(
    data: SectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    section = Section(**data.model_dump())
    db.add(section)
    db.commit()
    db.refresh(section)
    return section


@router.put("/sections/{section_id}", response_model=SectionResponse)
def update_section(
    section_id: int,
    data: SectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    section = db.query(Section).filter(Section.id == section_id).first()
    if not section:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Section not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(section, k, v)
    db.commit()
    db.refresh(section)
    return section


@router.delete("/sections/{section_id}")
def delete_section(
    section_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    section = db.query(Section).filter(Section.id == section_id).first()
    if not section:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Section not found")
    db.delete(section)
    db.commit()
    return {"message": "Section deleted"}
