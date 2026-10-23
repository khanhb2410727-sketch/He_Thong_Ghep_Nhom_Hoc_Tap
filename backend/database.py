from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# Cấu hình đường dẫn kết nối (Sửa lại user:password và tên database cho đúng)
# Cú pháp: mysql+pymysql://<user>:<password>@<host>/<db_name>
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://dev:123456@localhost/he_thong_ghep_nhom_hoc_tap"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Hàm lấy DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()