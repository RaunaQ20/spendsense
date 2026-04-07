from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from database import Base
from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

# SQLAlchemy Models (Database definitions)
class DBExpense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    merchant = Column(String, index=True)
    category = Column(String, index=True)
    date = Column(Date, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# Pydantic Schemas (API validation definitions)
class ExpenseBase(BaseModel):
    amount: float
    merchant: str
    category: str
    date: date
    description: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
