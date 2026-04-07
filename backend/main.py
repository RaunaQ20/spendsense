from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
import os
import shutil
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import ml_services
from database import SessionLocal, engine

# Create the database tables automatically when starting
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SpendSense API", description="Backend for Smart Expense Tracker")

# Setup CORS for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get Database session per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to SpendSense API. Go to /docs for Swagger UI"}

@app.post("/expenses/", response_model=models.Expense)
def create_expense(expense: models.ExpenseCreate, db: Session = Depends(get_db)):
    db_expense = models.DBExpense(**expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.get("/expenses/", response_model=List[models.Expense])
def read_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    expenses = db.query(models.DBExpense).offset(skip).limit(limit).all()
    return expenses

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    db_expense = db.query(models.DBExpense).filter(models.DBExpense.id == expense_id).first()
    if db_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(db_expense)
    db.commit()
    return {"message": "Expense deleted successfully"}

# --- AI Insight Endpoints ---

@app.get("/categorize/")
def categorize_expense(description: str):
    """Predicts category using NLP based on the description text."""
    category = ml_services.auto_categorize(description)
    return {"category": category}

@app.post("/upload/")
def upload_receipt(file: UploadFile = File(...)):
    """Upload a receipt image and extract data using Tesseract OCR."""
    os.makedirs("temp_uploads", exist_ok=True)
    file_location = f"temp_uploads/{file.filename}"
    
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    extracted_data = ml_services.extract_receipt_data(file_location)
    
    # Clean up
    if os.path.exists(file_location):
        os.remove(file_location)
        
    return extracted_data

@app.get("/insights/")
def get_insights(db: Session = Depends(get_db)):
    """Calculates basic insights like total spent and projected monthly total."""
    import datetime
    expenses = db.query(models.DBExpense).all()
    total_spent = sum(e.amount for e in expenses)
    
    today = datetime.date.today()
    days_passed = today.day
    projected = 0
    if days_passed > 0:
        daily_average = total_spent / days_passed
        projected = daily_average * 30
        
    return {
        "total_spent": total_spent,
        "projected_end_of_month": projected,
        "expense_count": len(expenses)
    }
