import smtplib
import ssl
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication


def send_email(smtp_config: dict, recipient: dict, subject: str, body: str, attachment_paths: list[str]) -> dict:
    """
    Send a single email to one recipient.

    Args:
        smtp_config: { server, port, sender_email, sender_password }
        recipient:   { name, email, company }
        subject:     Email subject string
        body:        Email body string (plain text)
        attachment_paths: List of absolute file paths to attach

    Returns:
        { success: bool, message: str }
    """
    context = ssl.create_default_context()

    try:
        msg = MIMEMultipart()
        msg["From"] = smtp_config["sender_email"]
        msg["To"] = recipient["email"]
        msg["Subject"] = subject

        personalized_body = body.replace("{name}", recipient["name"]).replace("{company}", recipient["company"])
        msg.attach(MIMEText(personalized_body, "plain", "utf-8"))

        for path in attachment_paths:
            if os.path.exists(path):
                with open(path, "rb") as f:
                    part = MIMEApplication(f.read(), _subtype=_subtype(path))
                    part.add_header("Content-Disposition", "attachment", filename=os.path.basename(path))
                    msg.attach(part)

        with smtplib.SMTP(smtp_config["server"], int(smtp_config["port"])) as server:
            server.starttls(context=context)
            server.login(smtp_config["sender_email"], smtp_config["sender_password"])
            server.sendmail(smtp_config["sender_email"], recipient["email"], msg.as_string())

        return {"success": True, "message": f"Sent to {recipient['email']}"}

    except smtplib.SMTPAuthenticationError:
        return {"success": False, "message": "Authentication failed. Check your App Password."}
    except smtplib.SMTPRecipientsRefused:
        return {"success": False, "message": f"Recipient refused: {recipient['email']}"}
    except Exception as e:
        return {"success": False, "message": str(e)}


def _subtype(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    # Ensure all keys include the dot
    mapping = {
        ".pdf": "pdf", 
        ".docx": "vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".png": "png",
        ".jpg": "jpeg",
        ".jpeg": "jpeg"
    }
    return mapping.get(ext, "octet-stream")