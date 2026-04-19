import csv
import io
import os

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

from email_sender import send_email

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
ATTACH_DIR = os.path.join(DATA_DIR, "attachments")
CSV_PATH = os.path.join(DATA_DIR, "contacts.csv")

os.makedirs(ATTACH_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

ALLOWED_EXT = {"pdf", "doc", "docx", "jpg", "jpeg", "png", "txt"}


def _allowed(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT


def _read_csv():
    if not os.path.exists(CSV_PATH):
        return []
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            rows.append({
                "name": row.get("name", ""),
                "email": row.get("email", ""),
                "company": row.get("company", ""),
                "is_senator": row.get("is_senator", "False").strip().lower() == "true",
            })
        return rows


def _write_csv(contacts):
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["name", "email", "company", "is_senator"])
        writer.writeheader()
        for c in contacts:
            writer.writerow({
                "name": c["name"],
                "email": c["email"],
                "company": c["company"],
                "is_senator": c["is_senator"],
            })


# ── Contacts ────────────────────────────────────────────────────────────────

@app.get("/api/contacts")
def get_contacts():
    return jsonify(_read_csv())


@app.post("/api/contacts")
def add_contact():
    data = request.json
    contacts = _read_csv()
    contacts.append({
        "name": data["name"],
        "email": data["email"],
        "company": data.get("company", ""),
        "is_senator": bool(data.get("is_senator", False)),
    })
    _write_csv(contacts)
    return jsonify({"ok": True})


@app.put("/api/contacts/<int:index>")
def update_contact(index):
    data = request.json
    contacts = _read_csv()
    if index < 0 or index >= len(contacts):
        return jsonify({"error": "Not found"}), 404
    contacts[index] = {
        "name": data["name"],
        "email": data["email"],
        "company": data.get("company", ""),
        "is_senator": bool(data.get("is_senator", False)),
    }
    _write_csv(contacts)
    return jsonify({"ok": True})


@app.delete("/api/contacts/<int:index>")
def delete_contact(index):
    contacts = _read_csv()
    if index < 0 or index >= len(contacts):
        return jsonify({"error": "Not found"}), 404
    contacts.pop(index)
    _write_csv(contacts)
    return jsonify({"ok": True})


@app.post("/api/contacts/import")
def import_csv():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file"}), 400
    stream = io.StringIO(file.stream.read().decode("utf-8"))
    reader = csv.DictReader(stream)
    new_contacts = []
    for row in reader:
        new_contacts.append({
            "name": row.get("name", ""),
            "email": row.get("email", ""),
            "company": row.get("company", ""),
            "is_senator": row.get("is_senator", "False").strip().lower() == "true",
        })
    existing = _read_csv()
    existing.extend(new_contacts)
    _write_csv(existing)
    return jsonify({"imported": len(new_contacts)})


@app.get("/api/contacts/export")
def export_csv():
    contacts = _read_csv()
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["name", "email", "company", "is_senator"])
    writer.writeheader()
    writer.writerows(contacts)
    from flask import Response
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=contacts.csv"},
    )


# ── Attachments ─────────────────────────────────────────────────────────────

@app.get("/api/attachments")
def list_attachments():
    files = []
    for fname in os.listdir(ATTACH_DIR):
        path = os.path.join(ATTACH_DIR, fname)
        if os.path.isfile(path):
            files.append({"name": fname, "size": os.path.getsize(path)})
    return jsonify(files)


@app.post("/api/attachments")
def upload_attachment():
    file = request.files.get("file")
    if not file or not _allowed(file.filename):
        return jsonify({"error": "Invalid file"}), 400
    filename = secure_filename(file.filename)
    file.save(os.path.join(ATTACH_DIR, filename))
    return jsonify({"ok": True, "name": filename})


@app.delete("/api/attachments/<filename>")
def delete_attachment(filename):
    path = os.path.join(ATTACH_DIR, secure_filename(filename))
    if os.path.exists(path):
        os.remove(path)
    return jsonify({"ok": True})


@app.get("/api/attachments/<filename>")
def download_attachment(filename):
    return send_from_directory(ATTACH_DIR, secure_filename(filename))


# ── Send ─────────────────────────────────────────────────────────────────────

@app.post("/api/send")
def send_campaign():
    payload = request.json
    smtp_config = payload.get("smtp", {})
    recipients = payload.get("recipients", [])
    subject = payload.get("subject", "(no subject)")
    body = payload.get("body", "")
    selected_attachments = payload.get("attachments", [])

    attachment_paths = [
        os.path.join(ATTACH_DIR, secure_filename(name))
        for name in selected_attachments
        if os.path.exists(os.path.join(ATTACH_DIR, secure_filename(name)))
    ]

    results = []
    for r in recipients:
        result = send_email(smtp_config, r, subject, body, attachment_paths)
        results.append({"email": r["email"], **result})

    return jsonify(results)


if __name__ == "__main__":
    # Seed contacts.csv if it doesn't exist
    if not os.path.exists(CSV_PATH):
        seed = [
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
        _write_csv(seed)
        print("✓ Seeded contacts.csv")

    app.run(debug=True, port=5000)
