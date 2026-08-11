import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()


def send_payment_reminder_email(notifications: List[Dict[str, Any]]) -> bool:
    """
    Wysyła wiadomość e-mail z podsumowaniem alertów opłat (zaległe i zbliżające się).
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM", smtp_user or "homebudget@office.lab")
    email_to = os.getenv("NOTIFICATION_EMAIL_TO")
    use_tls = os.getenv("SMTP_TLS", "true").lower() == "true"

    if not smtp_host or not email_to:
        raise ValueError("SMTP_HOST oraz NOTIFICATION_EMAIL_TO muszą być skonfigurowane w pliku .env")

    if not notifications:
        return False

    # Budowanie treści HTML
    subject = f"🏠 HomeBudget: Alerty Płatności ({len(notifications)} pozycji)"

    html_items = ""
    for item in notifications:
        status_color = "#ef4444" if item["status"] == "overdue" else "#f59e0b"
        status_label = "ZALEGŁOŚĆ" if item["status"] == "overdue" else "ZBLIŻA SIĘ TERMIN"

        html_items += f"""
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; font-weight: bold; color: #0f172a;">{item['name']}</td>
            <td style="padding: 10px; font-weight: bold; color: #059669;">{item['amount']:.2f} zł</td>
            <td style="padding: 10px;"><span style="background: {status_color}15; color: {status_color}; font-weight: bold; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem;">{status_label}</span></td>
            <td style="padding: 10px; color: #64748b;">{item['message']}</td>
        </tr>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f8fafc; color: #334155; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <h2 style="color: #0f172a; margin-top: 0;">🏠 HomeBudget — Alerty Płatności</h2>
            <p>Poniżej znajduje się zestawienie płatności wymagających uwagi:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                <thead>
                    <tr style="background: #f1f5f9; text-align: left; font-size: 0.85rem; color: #475569;">
                        <th style="padding: 8px;">Wydatek</th>
                        <th style="padding: 8px;">Kwota</th>
                        <th style="padding: 8px;">Status</th>
                        <th style="padding: 8px;">Termin</th>
                    </tr>
                </thead>
                <tbody>
                    {html_items}
                </tbody>
            </table>
            
            <p style="margin-top: 24px; font-size: 0.85rem; color: #94a3b8; text-align: center;">
                Wiadomość wygenerowana automatycznie przez system HomeBudget.
            </p>
        </div>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = smtp_from
    msg["To"] = email_to
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        if use_tls:
            server.starttls()
        if smtp_user and smtp_password:
            server.login(smtp_user, smtp_password)
        server.sendmail(smtp_from, [email_to], msg.as_string())

    return True
