# MailBlast PH — Email Campaign Manager

A React + Python (Flask) email campaign tool for sending medical assistance requests.

## Quick Start

### 1. Backend (Python/Flask)
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Backend runs on http://localhost:5000

### 2. Frontend (React)
```bash
cd frontend
npm install
npm start
```
Frontend runs on http://localhost:3000

---

## Project Structure
```
mailblast/
├── backend/
│   ├── app.py               # Flask API server
│   ├── email_sender.py      # SMTP email logic
│   ├── requirements.txt
│   └── data/
│       ├── contacts.csv     # Editable contact list
│       └── attachments/     # Uploaded attachment files
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── Contacts.jsx
    │   │   ├── Attachments.jsx
    │   │   ├── Compose.jsx
    │   │   └── Send.jsx
    │   └── index.js
    ├── public/index.html
    └── package.json
```

## Gmail App Password Setup
1. Enable 2FA on your Google account
2. Go to Google Account → Security → App Passwords
3. Create an app password for "Mail"
4. Paste it into the Send tab (or set `GMAIL_APP_PASSWORD` env var)
