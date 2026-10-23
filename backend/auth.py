import bcrypt
from jose import jwt
from datetime import datetime, timedelta, timezone

SECRET_KEY = "chuoi_bi_mat_cua_do_an_nckh_2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # Token có hạn 1 ngày

def hash_password(password: str) -> str:
    # Chuyển mật khẩu sang dạng bytes
    pwd_bytes = password.encode('utf-8')
    # Tạo muối (salt) và băm mật khẩu
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    # Dùng timezone.utc để không bị Python 3.14 cảnh báo
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt