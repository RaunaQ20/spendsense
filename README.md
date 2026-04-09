# SpendSense
A  smart, AI powered Full-Stack Expense Tracker featuring NLP and OCR, built with React, FastAPI and Scikit Learn. 

## Core Features
*   **Computer Vision (OCR):** Upload physical receipts, and the system uses Tesseract-OCR and RegEx heuristics to extract the Date, Merchant, and Total Cost.
*   **Natural Language Categorization (NLP):** Whenever an expense is logged, a Scikit Learn Machine Learning pipeline (TF-IDF + Naive Bayes) instantly processes the text and correctly predicts the category tag (e.g. `Uber` -> `Transportation`, `Starbucks` -> `Food & Dining`).
*   **Predictive Spending Dashboards:** The system calculates real time spending velocity and accurately projects an End of Month expenditure estimate.
*   **Modern 'Glassmorphism' Frontend:** Built using React, Vite, Recharts, and TailwindCSS v4.

## 💻 Technology Stack
*   **Frontend:** ReactJS, Vite, Tailwind CSS v4, Recharts, Lucide-React
*   **Backend:** Python 3, FastAPI, SQLAlchemy
*   **Database:** SQLite 
*   **AI Engine:** Scikit-Learn (ML), pytesseract (OCR), Pillow

## How to Run Locally

### 1. Start the Backend
Navigate to the `backend` folder, start the virtual environment, and run the server. Ensure that you have `tesseract` installed on your machine (`brew install tesseract`).
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt  # Optional if migrating
uvicorn main:app --reload
```
View the interactive API documentation at: `http://localhost:8000/docs`

### 2. Start the Frontend
Navigate to the `frontend` folder and start the Vite dev server.
```bash
cd frontend
npm install
npm run dev
```

Visit the displayed local URL (typically `http://localhost:5173`).

---
Developed by [RaunaQ20](https://github.com/RaunaQ20). 
