from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User, Student
from backend.app.schemas import LoginRequest, TokenResponse, UserResponse
from backend.app.security import verify_password, create_access_token
from backend.app.dependencies import get_current_user
from backend.app.mongodb import mongo_db

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # CRITICAL: Verify selected role matches user's actual stored role
    if user.role.upper() != payload.role.strip().upper():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is registered as {user.role}, not {payload.role.upper()}"
        )

    student_id = None
    name = None
    if user.role.upper() == "STUDENT":
        student = db.query(Student).filter(Student.user_id == user.user_id).first()
        if student:
            student_id = student.student_id
            name = student.name
    else:
        name = "Administrator"

    access_token = create_access_token(data={"sub": str(user.user_id), "role": user.role.upper()})

    mongo_db.log_activity(
        user_id=user.user_id,
        role=user.role.upper(),
        action="USER_LOGIN",
        entity="user",
        entity_id=user.user_id,
        details={"email": user.email}
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role.upper(),
        user_id=user.user_id,
        email=user.email,
        student_id=student_id,
        name=name
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
