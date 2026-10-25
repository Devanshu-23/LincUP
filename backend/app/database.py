from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os

Db_URL = os.getenv(
    "Db_URL",
    "postgresql+psycopg2://localhost:5432/lincup"
)
engine = create_engine(Db_URL)
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)
Base = declarative_base() #Db model