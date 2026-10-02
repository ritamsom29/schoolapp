from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.school_settings import SchoolSettings
from app.schemas.settings import SchoolSettingsResponse, SchoolSettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("", response_model=SchoolSettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(SchoolSettings).first()
    if not settings:
        settings = SchoolSettings(school_name="Delhi Public School")
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("", response_model=SchoolSettingsResponse)
def update_settings(
    data: SchoolSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    settings = db.query(SchoolSettings).first()
    if not settings:
        settings = SchoolSettings()
        db.add(settings)

    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(settings, field, val)

    db.commit()
    db.refresh(settings)
    return settings
