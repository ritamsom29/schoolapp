from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True

class UserWithTeacherResponse(UserResponse):
    teacher_id: Optional[str] = None
    teacher_name: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
