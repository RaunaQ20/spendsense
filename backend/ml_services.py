import os
import re
from PIL import Image
import pytesseract
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline
import joblib

MODEL_FILE = "expense_model.pkl"

# Dummy initial training data
default_X = [
    "McDonalds burger", "Starbucks coffee", "Uber ride", "Lyft fare", 
    "Shell gas station", "Chevron fuel", "Walmart groceries", "Target household", 
    "Amazon online shopping", "Netflix subscription", "Electric bill", "Water bill"
]
default_y = [
    "Food & Dining", "Food & Dining", "Transportation", "Transportation",
    "Auto & Transport", "Auto & Transport", "Groceries", "Shopping",
    "Shopping", "Entertainment", "Bills & Utilities", "Bills & Utilities"
]

def load_or_train_model():
    """Loads the ML model from disk or trains a new one if it doesn't exist."""
    if os.path.exists(MODEL_FILE):
        return joblib.load(MODEL_FILE)
    
    # Train a new simple categorized model
    model = make_pipeline(TfidfVectorizer(), MultinomialNB())
    model.fit(default_X, default_y)
    joblib.dump(model, MODEL_FILE)
    return model

# Global model instance
categorizer = load_or_train_model()

def auto_categorize(description: str) -> str:
    """Predicts expense category based on the description text."""
    if not description:
        return "Uncategorized"
    prediction = categorizer.predict([description])[0]
    return prediction

def extract_receipt_data(image_path: str) -> dict:
    """Extracts text from an image and uses Regex to find amount and date."""
    try:
        # Require tesseract installed on the system
        text = pytesseract.image_to_string(Image.open(image_path))
    except Exception as e:
        return {"error": f"OCR Failed. Is Tesseract installed? {str(e)}"}
    
    data = {
        "raw_text": text,
        "amount": None,
        "date": None,
        "merchant": "Unknown Merchant"
    }
    
    # Simple regex for amount (e.g. Total: $12.34 or 12.34)
    # Looking for 'Total' nearby an amount is robust, but we will just look for the largest currency format for simplicity.
    amounts = re.findall(r'\$?\s?(\d+\.\d{2})', text)
    if amounts:
        # Convert to float and take the maximum (often the total)
        floats = [float(a) for a in amounts]
        data["amount"] = max(floats)
        
    # Simple regex for date (MM/DD/YYYY or DD-MM-YYYY)
    dates = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text)
    if dates:
        data["date"] = dates.group(1)
        
    # Attempt to grab merchant (first non-empty line)
    lines = [lin.strip() for lin in text.split('\n') if lin.strip()]
    if lines:
        data["merchant"] = lines[0] # Very naive heuristic, but works for mockups.
        
    return data
