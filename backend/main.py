import csv
import io
import os
from typing import List, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from werkzeug.utils import secure_filename

from email_sender import send_email

app = FastAPI(title="MailBlast PH")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
ATTACH_DIR = os.path.join(DATA_DIR, "attachments")
CSV_PATH = os.path.join(DATA_DIR, "contacts.csv")
DIST_DIR = os.path.join(BASE_DIR, "..", "frontend", "dist")

os.makedirs(ATTACH_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

ALLOWED_EXT = {"pdf", "doc", "docx", "jpg", "jpeg", "png", "txt"}

SEED_CONTACTS = [
    {"name": "Vicente C. Sotto III", "email": "senatorvicentesotto@gmail.com", "company": "Philippine Senate", "is_senator": True},
    {"name": "Panfilo M. Lacson", "email": "ospml2025@gmail.com", "company": "Philippine Senate", "is_senator": True},
    {"name": "Juan Miguel F. Zubiri", "email": "senmigzubiri.medical@gmail.com", "company": "Philippine Senate", "is_senator": True},
    {"name": "Alan Peter S. Cayetano", "email": "alanpeter@cayetano.com.ph", "company": "Philippine Senate", "is_senator": True},
    {"name": "Bam Aquino", "email": "frontoffice@bamaquino.com", "company": "Philippine Senate", "is_senator": True},
    {"name": "Pia S. Cayetano", "email": "pia@piacayetano.ph", "company": "Philippine Senate", "is_senator": True},
    {"name": "Ronald Dela Rosa", "email": "secretariat.batodelarosa@gmail.com", "company": "Philippine Senate", "is_senator": True},
    {"name": "Joseph Victor G. Ejercito", "email": "publiacassistance@jvejercito.com", "company": "Philippine Senate", "is_senator": True},
    {"name": "Francis G. Escudero", "email": "sen.escudero@gmail.com", "company": "Philippine Senate", "is_senator": True},
    {"name": "Jinggoy Ejercito Estrada", "email": "anakngmasa@jinggoyestrada.ph", "company": "Philippine Senate", "is_senator": True},
    {"name": "Win Gatchalian", "email": "email@wingatchalian.com", "company": "Philippine Senate", "is_senator": True},
    {"name": "Christopher Lawrence T. Go", "email": "senbgconcerns@gmail.com", "company": "Philippine Senate", "is_senator": True},
    {"name": "Risa Hontiveros", "email": "risahq@gmail.com", "company": "Philippine Senate", "is_senator": True},
    {"name": "Manuel M. Lapid", "email": "sen.manuellitolapid@gmail.com", "company": "Philippine Senate", "is_senator": True},
    {"name": "1-PACMAN Partylist", "email": "onepacmanpartylist@yahoo.com", "company": "Party-list Organization", "is_senator": False},
    {"name": "4PS Partylist", "email": "4pspartylistph@gmail.com", "company": "Party-list Organization", "is_senator": False},
    {"name": "AAMBIS-OWA Partylist", "email": "info@aambisowa.com", "company": "Party-list Organization", "is_senator": False},
    {"name": "Abang Lingkod Partylist", "email": "abanglingkodpartylist@gmail.com", "company": "Party-list Organization", "is_senator": False},
    {"name": "ABONO Partylist", "email": "abonopartylist12@gmail.com", "company": "Party-list Organization", "is_senator": False},
    {"name": "ACT Teachers Partylist", "email": "rep.france.castro@actteachersparty-list.com", "company": "Party-list Organization", "is_senator": False},
    {"name": "AGAP Partylist", "email": "agappartylist@gmail.com", "company": "Party-list Organization", "is_senator": False},
    {"name": "AGIMAT Partylist", "email": "mabuhay@agimat.org.ph", "company": "Party-list Organization", "is_senator": False},
    {"name": "AGRI Partylist", "email": "info@agripartylist.com", "company": "Party-list Organization", "is_senator": False},
    {"name": "Ako Bicol Partylist", "email": "akobicolpartylist@yahoo.com", "company": "Party-list Organization", "is_senator": False},
    {"name": "ALONA Partylist", "email": "alonapartylist@gmail.com", "company": "Party-list Organization", "is_senator": False},
    {"name": "An Waray Partylist", "email": "anwarayinquiries@gmail.com", "company": "Party-list Organization", "is_senator": False},
    {"name": "Ang Probinsyano Partylist", "email": "teamangprobinsyano@gmail.com", "company": "Party-list Organization", "is_senator": False},
    {"name": "Bagong Henerasyon Partylist", "email": "info@bagonghenerasyon.net", "company": "Party-list Organization", "is_senator": False},
    {"name": "BHW Partylist", "email": "info@bhwpartylist.com", "company": "Party-list Organization", "is_senator": False},
    {"name": "CIBAC Partylist", "email": "cibac.party@gmail.com", "company": "Party-list Organization", "is_senator": False},
    {"name": "CSW Partylist", "email": "cwspartylist@gmail.com", "company": "Party-list Organization", "is_senator": False},
    {"name": "DUMPER PTDA Partylist", "email": "dumperptdapartylist2019@gmail.com", "company": "Party-list Organization", "is_senator": False},
    {"name": "Duterte Youth Partylist", "email": "duterteyouth@gmail.com", "company": "Party-list Organization", "is_senator": False},
    {"name": "GP Partylist", "email": "msmp@ymail.com", "company": "Party-list Organization", "is_senator": False},
    {"name": "Kabataan Partylist", "email": "kabataanpartylist@gmail.com", "company": "Party-list Organization", "is_senator": False},
]


# ── Pydantic models ──────────────────────────────────────────────────────────

class Contact(BaseModel):
    name: str
    email: str
    company: str = ""
    is_senator: bool = False

class SmtpConfig(BaseModel):
    sender_email: str
    sender_password: str
    server: str = "smtp.gmail.com"
    port: str = "587"

class SendPayload(BaseModel):
    smtp: SmtpConfig
    recipients: List[Contact]
    subject: str
    body: str
    attachments: List[str] = []


# ── CSV helpers ──────────────────────────────────────────────────────────────

def _read_csv() -> list:
    if not os.path.exists(CSV_PATH):
        return []
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return [{
            "name": r.get("name", ""),
            "email": r.get("email", ""),
            "company": r.get("company", ""),
            "is_senator": r.get("is_senator", "False").strip().lower() == "true",
        } for r in reader]

def _write_csv(contacts: list):
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["name", "email", "company", "is_senator"])
        w.writeheader()
        w.writerows(contacts)


# ── Contacts ─────────────────────────────────────────────────────────────────

@app.get("/api/contacts")
def get_contacts():
    return _read_csv()

@app.post("/api/contacts", status_code=201)
def add_contact(contact: Contact):
    contacts = _read_csv()
    contacts.append(contact.model_dump())
    _write_csv(contacts)
    return {"ok": True}

@app.put("/api/contacts/{index}")
def update_contact(index: int, contact: Contact):
    contacts = _read_csv()
    if index < 0 or index >= len(contacts):
        raise HTTPException(status_code=404, detail="Not found")
    contacts[index] = contact.model_dump()
    _write_csv(contacts)
    return {"ok": True}

@app.delete("/api/contacts/{index}")
def delete_contact(index: int):
    contacts = _read_csv()
    if index < 0 or index >= len(contacts):
        raise HTTPException(status_code=404, detail="Not found")
    contacts.pop(index)
    _write_csv(contacts)
    return {"ok": True}

@app.post("/api/contacts/import")
async def import_contacts(file: UploadFile = File(...)):
    content = await file.read()
    stream = io.StringIO(content.decode("utf-8"))
    reader = csv.DictReader(stream)
    new_contacts = [{
        "name": r.get("name", ""),
        "email": r.get("email", ""),
        "company": r.get("company", ""),
        "is_senator": r.get("is_senator", "False").strip().lower() == "true",
    } for r in reader]
    existing = _read_csv()
    existing.extend(new_contacts)
    _write_csv(existing)
    return {"imported": len(new_contacts)}

@app.get("/api/contacts/export")
def export_contacts():
    contacts = _read_csv()
    output = io.StringIO()
    w = csv.DictWriter(output, fieldnames=["name", "email", "company", "is_senator"])
    w.writeheader()
    w.writerows(contacts)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=contacts.csv"},
    )


# ── Attachments ───────────────────────────────────────────────────────────────

@app.get("/api/attachments")
def list_attachments():
    files = []
    for fname in os.listdir(ATTACH_DIR):
        path = os.path.join(ATTACH_DIR, fname)
        if os.path.isfile(path):
            files.append({"name": fname, "size": os.path.getsize(path)})
    return files

@app.post("/api/attachments")
async def upload_attachment(file: UploadFile = File(...)):
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="File type not allowed")
    filename = secure_filename(file.filename)
    content = await file.read()
    with open(os.path.join(ATTACH_DIR, filename), "wb") as f:
        f.write(content)
    return {"ok": True, "name": filename}

@app.delete("/api/attachments/{filename}")
def delete_attachment(filename: str):
    path = os.path.join(ATTACH_DIR, secure_filename(filename))
    if os.path.exists(path):
        os.remove(path)
    return {"ok": True}

@app.get("/api/attachments/{filename}")
def download_attachment(filename: str):
    path = os.path.join(ATTACH_DIR, secure_filename(filename))
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, filename=filename)


# ── Send ──────────────────────────────────────────────────────────────────────

@app.post("/api/send")
def send_campaign(payload: SendPayload):
    attachment_paths = [
        os.path.join(ATTACH_DIR, secure_filename(name))
        for name in payload.attachments
        if os.path.exists(os.path.join(ATTACH_DIR, secure_filename(name)))
    ]
    results = []
    for r in payload.recipients:
        result = send_email(payload.smtp.model_dump(), r.model_dump(), payload.subject, payload.body, attachment_paths)
        results.append({"email": r.email, **result})
    return results


# ── Serve React build (production) ────────────────────────────────────────────

if os.path.exists(DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        index = os.path.join(DIST_DIR, "index.html")
        return FileResponse(index)


# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup():
    if not os.path.exists(CSV_PATH):
        _write_csv(SEED_CONTACTS)
        print("✓ Seeded contacts.csv")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=5000, reload=True)
