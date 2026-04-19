# MailBlast PH — FastAPI + React (Vite)

Email campaign manager for sending medical assistance requests.

---

## Setup

### Backend (FastAPI)

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

API runs at → http://127.0.0.1:5000  
Interactive API docs → http://127.0.0.1:5000/docs

---

### Frontend — Development

```powershell
cd frontend
npm install
npm run dev
```

Opens at → http://localhost:3000

---

### Frontend — Production Build

```powershell
cd frontend
npm run build
```

Outputs to `frontend/dist/`.  
FastAPI automatically serves the built React app at http://127.0.0.1:5000  
**No separate frontend server needed in production.**

---

## Project Structure

```
mailblast/
├── backend/
│   ├── main.py              ← FastAPI app (replaces Flask)
│   ├── email_sender.py      ← SMTP logic
│   ├── requirements.txt
│   └── data/
│       ├── contacts.csv     ← auto-created on first run
│       └── attachments/     ← uploaded files
└── frontend/
    ├── src/
    │   ├── main.jsx         ← entry point
    │   ├── App.jsx
    │   ├── api.js           ← axios instance
    │   ├── index.css
    │   └── components/
    │       ├── Contacts.jsx
    │       ├── Attachments.jsx
    │       ├── Compose.jsx
    │       └── Send.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Gmail App Password

1. Enable 2FA on Google Account
2. Go to Google Account → Security → App Passwords
3. Generate one for "Mail"
4. Enter it in the Send tab

---

## API Endpoints (FastAPI)

| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/contacts | List all contacts |
| POST | /api/contacts | Add contact |
| PUT | /api/contacts/{index} | Update contact |
| DELETE | /api/contacts/{index} | Delete contact |
| POST | /api/contacts/import | Import CSV file |
| GET | /api/contacts/export | Download CSV |
| GET | /api/attachments | List attachments |
| POST | /api/attachments | Upload file |
| DELETE | /api/attachments/{filename} | Delete file |
| GET | /api/attachments/{filename} | Download file |
| POST | /api/send | Send campaign |

Full interactive docs at: http://127.0.0.1:5000/docs
