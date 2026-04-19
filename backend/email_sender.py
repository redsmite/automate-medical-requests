import smtplib
import ssl
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication


def send_email(smtp_config: dict, recipient: dict, subject: str, body: str, attachment_paths: list) -> dict:
    context = ssl.create_default_context()
    try:
        msg = MIMEMultipart()
        msg["From"] = smtp_config["sender_email"]
        msg["To"] = recipient["email"]
        msg["Subject"] = subject

        personalized = body.replace("{name}", recipient.get("name", "")).replace("{company}", recipient.get("company", ""))
        msg.attach(MIMEText(personalized, "plain", "utf-8"))

        for path in attachment_paths:
            if os.path.exists(path):
                with open(path, "rb") as f:
                    ext = os.path.splitext(path)[1].lower().lstrip(".")
                    subtype = "pdf" if ext == "pdf" else "octet-stream"
                    part = MIMEApplication(f.read(), _subtype=subtype)
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
