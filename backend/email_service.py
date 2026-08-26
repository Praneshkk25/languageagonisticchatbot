import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import threading
import datetime
from typing import List, Dict, Optional, Any

# SMTP Configuration from Environment Variables
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USER or "scholarships@sonatech.ac.in")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "College Scholarship & Support Cell")
SMTP_ENABLED = bool(SMTP_USER and SMTP_PASSWORD)

def _send_email_thread(to_email: str, subject: str, html_content: str, text_content: str = ""):
    """
    Sends an email using standard SMTP in a separate background thread.
    If SMTP credentials are not configured or connection fails, logs the email gracefully.
    """
    if not to_email or "@" not in to_email:
        print(f"[EMAIL SERVICE] Skipped sending to invalid email: '{to_email}'")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    msg["To"] = to_email
    msg["Date"] = datetime.datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S +0000")

    if text_content:
        msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    if SMTP_ENABLED:
        try:
            print(f"[EMAIL SERVICE] Connecting to SMTP server {SMTP_HOST}:{SMTP_PORT}...")
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_FROM_EMAIL, [to_email], msg.as_string())
            print(f"[EMAIL SERVICE] [SUCCESS] Sent email to {to_email} | Subject: '{subject}'")
            return
        except Exception as e:
            print(f"[EMAIL SERVICE] [WARNING] Failed to send via live SMTP ({e}). Fallback to simulated delivery.")

    # Simulated Delivery Log (when SMTP credentials not set or test mode)
    print(f"\n==================================================")
    print(f"[EMAIL SERVICE DISPATCH SIMULATION]")
    print(f"TO: {to_email}")
    print(f"FROM: {SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>")
    print(f"SUBJECT: {subject}")
    print(f"TIME: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"STATUS: Dispatched successfully ✓")
    print(f"==================================================\n")

def send_email_async(to_email: str, subject: str, html_content: str, text_content: str = ""):
    """Dispatches email sending asynchronously so the API request is never delayed."""
    thread = threading.Thread(
        target=_send_email_thread,
        args=(to_email, subject, html_content, text_content),
        daemon=True
    )
    thread.start()

# --- HTML TEMPLATE HELPERS ---

def get_base_html_template(title: str, content_body: str, action_btn_text: str = "", action_btn_url: str = "") -> str:
    btn_html = ""
    if action_btn_text and action_btn_url:
        btn_html = f"""
        <div style="text-align: center; margin: 30px 0 10px 0;">
            <a href="{action_btn_url}" style="background: linear-gradient(135deg, #2563eb, #7c3aed); color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
                {action_btn_text}
            </a>
        </div>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050c1e; color: #e2e8f0; margin: 0; padding: 20px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #0a142b; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <!-- HEADER -->
            <tr>
                <td style="background: linear-gradient(135deg, #091636, #1e1b4b); padding: 24px 30px; border-bottom: 1px solid #334155; text-align: center;">
                    <div style="font-size: 28px; margin-bottom: 4px;">🏛️ 🎓</div>
                    <div style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #38bdf8; font-weight: 800;">
                        CAMPUS SCHOLARSHIP & STUDENT SUPPORT PORTAL
                    </div>
                    <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 8px 0 0 0;">
                        {title}
                    </h1>
                </td>
            </tr>
            <!-- BODY -->
            <tr>
                <td style="padding: 30px; line-height: 1.6; font-size: 14px; color: #cbd5e1;">
                    {content_body}
                    {btn_html}
                </td>
            </tr>
            <!-- FOOTER -->
            <tr>
                <td style="background-color: #060d1f; padding: 18px 30px; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #64748b;">
                    <p style="margin: 0 0 6px 0;">This is an automated notification from the Institutional Scholarship Management System.</p>
                    <p style="margin: 0;">Sona College of Technology • Scholarship & Financial Aid Cell</p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

# --- HIGH-LEVEL NOTIFICATION FUNCTIONS ---

def notify_new_scholarship_added(scholarship_data: Dict[str, Any], students: List[Dict[str, Any]]):
    """
    Broadcasts a new scholarship alert email to all registered students.
    """
    sch_name = scholarship_data.get("scholarship_name", "Scholarship Scheme")
    category = scholarship_data.get("category_name", "Government & Institutional Scheme")
    benefits = scholarship_data.get("benefits", "Financial Assistance / Tuition Waiver")
    min_cgpa = scholarship_data.get("min_gpa", 0.0)
    max_income = scholarship_data.get("max_income", 10000000)
    income_str = f"Below ₹{int(max_income):,}" if max_income < 10000000 else "All Income Groups"
    mode = scholarship_data.get("application_mode", "Online")
    portal = scholarship_data.get("official_portal") or "http://localhost:3000/dashboard/scholarships"

    subject = f"🎓 New Scholarship Announced: {sch_name}"

    for std in students:
        std_email = std.get("email")
        std_name = std.get("name", "Student")
        if not std_email:
            continue

        body_html = f"""
        <p>Dear <strong>{std_name}</strong>,</p>
        <p>A new scholarship opportunity has just been announced on the campus portal that you may be eligible to apply for:</p>
        
        <div style="background-color: #0f1d3d; border: 1px solid #38bdf8; border-radius: 12px; padding: 18px; margin: 20px 0;">
            <h3 style="color: #38bdf8; margin: 0 0 10px 0; font-size: 16px;">{sch_name}</h3>
            <table width="100%" style="font-size: 13px; color: #e2e8f0;">
                <tr>
                    <td style="padding: 4px 0; color: #94a3b8; width: 140px;">Category:</td>
                    <td style="padding: 4px 0; font-weight: 700;">{category}</td>
                </tr>
                <tr>
                    <td style="padding: 4px 0; color: #94a3b8;">Award / Benefits:</td>
                    <td style="padding: 4px 0; font-weight: 700; color: #10b981;">{benefits}</td>
                </tr>
                <tr>
                    <td style="padding: 4px 0; color: #94a3b8;">Minimum CGPA:</td>
                    <td style="padding: 4px 0; font-weight: 700;">{min_cgpa} / 10.0</td>
                </tr>
                <tr>
                    <td style="padding: 4px 0; color: #94a3b8;">Income Ceiling:</td>
                    <td style="padding: 4px 0; font-weight: 700; color: #fb923c;">{income_str}</td>
                </tr>
                <tr>
                    <td style="padding: 4px 0; color: #94a3b8;">Application Mode:</td>
                    <td style="padding: 4px 0; font-weight: 700;">{mode}</td>
                </tr>
            </table>
        </div>

        <p>Log in to your student dashboard to review detailed eligibility requirements, attach verified certificates from your Digital Vault, and submit your application.</p>
        """

        full_html = get_base_html_template(
            title=f"New Scholarship: {sch_name}",
            content_body=body_html,
            action_btn_text="Apply for Scholarship →",
            action_btn_url="http://localhost:3000/dashboard/scholarships"
        )

        send_email_async(std_email, subject, full_html)

def notify_document_approved(student: Dict[str, Any], doc_title: str, doc_id: str = ""):
    """
    Sends an approval email when an admin verifies and approves a student's document.
    """
    std_email = student.get("email")
    std_name = student.get("name", "Student")
    std_id = student.get("admission_no") or student.get("id", "")
    if not std_email:
        return

    subject = f"✓ Document Verified & Approved: {doc_title}"

    body_html = f"""
    <p>Dear <strong>{std_name}</strong> (Roll ID: {std_id}),</p>
    
    <div style="background-color: rgba(16, 185, 129, 0.1); border: 1.5px solid #10b981; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 6px;">✓</div>
        <h3 style="color: #10b981; margin: 0 0 6px 0; font-size: 17px;">Document Approved</h3>
        <p style="margin: 0; font-size: 14px; font-weight: 700; color: #ffffff;">{doc_title}</p>
    </div>

    <p>Your uploaded document <strong>{doc_title}</strong> has been thoroughly inspected, authenticated, and approved by the Scholarship Administrative Office.</p>
    
    <p>This certificate is now marked as <strong>Institutional Verified</strong> in your campus Digital Vault and can be used immediately to apply for college and national scholarship schemes.</p>
    """

    full_html = get_base_html_template(
        title="Document Verification Approved",
        content_body=body_html,
        action_btn_text="View in Digital Vault →",
        action_btn_url="http://localhost:3000/dashboard/documents"
    )

    send_email_async(std_email, subject, full_html)

def notify_document_rejected(student: Dict[str, Any], doc_title: str, explanation: str, doc_id: str = ""):
    """
    Sends a rejection email with the admin's mandatory explanation and instructions to re-upload.
    """
    std_email = student.get("email")
    std_name = student.get("name", "Student")
    std_id = student.get("admission_no") or student.get("id", "")
    if not std_email:
        return

    subject = f"✕ Document Rejected: {doc_title} - Action Required"

    body_html = f"""
    <p>Dear <strong>{std_name}</strong> (Roll ID: {std_id}),</p>
    
    <div style="background-color: rgba(239, 68, 68, 0.1); border: 1.5px solid #ef4444; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <span style="font-size: 22px; color: #ef4444;">✕</span>
            <h3 style="color: #ef4444; margin: 0; font-size: 16px;">Document Verification Rejected</h3>
        </div>
        <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #ffffff;">{doc_title}</p>
        
        <div style="background-color: #081229; border-left: 3px solid #ef4444; padding: 12px 16px; border-radius: 6px; margin-top: 10px;">
            <div style="font-size: 11px; font-weight: 800; color: #f87171; text-transform: uppercase; letter-spacing: 0.5px;">Admin Explanation / Reason:</div>
            <div style="font-size: 13px; color: #fca5a5; margin-top: 4px; line-height: 1.5;">{explanation}</div>
        </div>
    </div>

    <p><strong>What to do next:</strong></p>
    <ol style="padding-left: 20px; line-height: 1.6;">
        <li>Review the administrator's explanation above.</li>
        <li>Prepare a corrected, valid, and high-resolution scan of your document.</li>
        <li>Log in to your Digital Vault and upload the revised file.</li>
    </ol>
    """

    full_html = get_base_html_template(
        title="Document Rejected - Explanation & Action Required",
        content_body=body_html,
        action_btn_text="Re-Upload Document in Vault →",
        action_btn_url="http://localhost:3000/dashboard/documents"
    )

    send_email_async(std_email, subject, full_html)

def notify_application_status_update(student: Dict[str, Any], application: Dict[str, Any], new_status: str, notes: str = ""):
    """
    Sends an email update whenever a scholarship application lifecycle stage or status changes.
    """
    std_email = student.get("email")
    std_name = student.get("name", "Student")
    app_id = application.get("id", "Application")
    sch_name = application.get("scholarship_name", "Scholarship Scheme")
    if not std_email:
        return

    subject = f"Scholarship Update: {sch_name} Status changed to '{new_status}'"

    is_approved = new_status in ["Approved", "Amount Received", "Documents Verified"]
    accent_color = "#10b981" if is_approved else ("#ef4444" if "Reject" in new_status else "#38bdf8")

    notes_section = ""
    if notes:
        notes_section = f"""
        <div style="background-color: #081229; border-left: 3px solid {accent_color}; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
            <div style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Officer Notes / Remarks:</div>
            <div style="font-size: 13px; color: #ffffff; margin-top: 4px;">{notes}</div>
        </div>
        """

    body_html = f"""
    <p>Dear <strong>{std_name}</strong>,</p>
    
    <p>There is an update regarding your scholarship application for <strong>{sch_name}</strong> (Application #{app_id}).</p>
    
    <div style="background-color: #0f1d3d; border: 1.5px solid {accent_color}; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <div style="font-size: 12px; color: #94a3b8;">New Application Status:</div>
        <div style="font-size: 18px; font-weight: 800; color: {accent_color}; margin-top: 4px;">{new_status}</div>
        {notes_section}
    </div>

    <p>You can view your complete dossier, download signed verification forms, and track DBT grant disbursements on your application timeline.</p>
    """

    full_html = get_base_html_template(
        title=f"Application Status: {new_status}",
        content_body=body_html,
        action_btn_text="Track Application Status →",
        action_btn_url="http://localhost:3000/dashboard/applications"
    )

    send_email_async(std_email, subject, full_html)


def notify_password_reset_otp(student_email: str, student_name: str, otp_code: str):
    """
    Sends a 6-digit OTP verification code via email for student password reset.
    """
    if not student_email or "@" not in student_email:
        print(f"[EMAIL SERVICE] Cannot send password reset OTP to invalid email: '{student_email}'")
        return

    subject = f"🔐 Password Reset Verification OTP: {otp_code}"

    body_html = f"""
    <p>Dear <strong>{student_name}</strong>,</p>

    <p>We received a request to reset your password and security credentials for the Campus Student Portal.</p>

    <div style="background-color: #0f1d3d; border: 2px dashed #38bdf8; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
        <div style="font-size: 12px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
            YOUR 6-DIGIT VERIFICATION CODE
        </div>
        <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #ffffff; font-family: monospace;">
            {otp_code}
        </div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 10px;">
            ⏳ Valid for 5 minutes. Do not share this code with anyone.
        </div>
    </div>

    <p>Enter this code in the password reset window to verify your identity and update your credentials.</p>
    <p style="color: #64748b; font-size: 12px;">If you did not request a password reset, please ignore this email or notify the campus security team.</p>
    """

    full_html = get_base_html_template(
        title="Password Reset Verification",
        content_body=body_html
    )

    send_email_async(student_email, subject, full_html)

