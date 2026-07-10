import logging
from datetime import datetime, timedelta

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


def _branded_template(body_html: str) -> str:
    logo = settings.logo_url
    color = settings.brand_color
    company = settings.company_name
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  .wrapper {{ background:#f4f6f9; padding:32px 16px; font-family:'Segoe UI',Arial,sans-serif; }}
  .container {{ max-width:600px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.06); }}
  .header {{ background:{color}; padding:28px 36px; text-align:center; }}
  .header img {{ max-height:48px; width:auto; }}
  .body {{ padding:36px; color:#1a1a2e; font-size:15px; line-height:1.7; }}
  .body h2 {{ font-size:20px; font-weight:700; margin:0 0 16px; color:{color}; }}
  .body p {{ margin:0 0 14px; color:#4a4a6a; }}
  .button {{ display:inline-block; background:{color}; color:#fff !important; text-decoration:none; padding:14px 36px; border-radius:8px; font-weight:600; font-size:15px; margin:8px 0 16px; }}
  .button:hover {{ opacity:0.9; }}
  .meta {{ background:#f8f9fc; border-radius:8px; padding:16px 20px; margin:16px 0; font-size:14px; }}
  .meta strong {{ color:#1a1a2e; }}
  .footer {{ background:#f4f6f9; padding:24px 36px; text-align:center; font-size:12px; color:#8888a0; border-top:1px solid #e8eaf0; }}
  .footer a {{ color:{color}; text-decoration:none; }}
  .hr {{ border:none; border-top:1px solid #e8eaf0; margin:20px 0; }}
</style>
</head>
<body>
<div class="wrapper">
<div class="container">
<div class="header"><img src="{logo}" alt="{company}"></div>
<div class="body">
{body_html}
</div>
<div class="footer">
  <p style="margin:0 0 4px"><strong>{company}</strong></p>
  <p style="margin:0">This is an automated message from our recruitment system. Please do not reply directly.</p>
</div>
</div>
</div>
</body>
</html>"""


async def send_email(to: str, subject: str, html_content: str):
    if settings.dev_mode or not settings.resend_api_key:
        logger.info(f"[DEV EMAIL] To: {to}")
        logger.info(f"[DEV EMAIL] Subject: {subject}")
        logger.info(f"[DEV EMAIL] Body: {html_content}")
        return

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                json={
                    "from": f"{settings.sender_display_name} <{settings.sender_email}>",
                    "to": [to],
                    "subject": subject,
                    "html": html_content,
                },
                timeout=30.0,
            )
            response.raise_for_status()
            result = response.json()
            logger.info(f"Email sent to {to}: id={result.get('id')}")
            return result
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")


async def send_approval_email(
    to: str, name: str, job_title: str, stage: int, magic_link: str = "",
    expires_at: datetime | None = None,
):
    if stage == 1:
        subject = f"Congratulations {name}! You've advanced to Stage 2"
        expiry_html = ""
        if expires_at:
            expiry_str = expires_at.strftime("%B %d, %Y at %I:%M %p %Z")
            expiry_html = f'<p style="color:#dc2626;font-size:13px;font-weight:600">This link expires on <strong>{expiry_str}</strong>.</p>'
        body = f"""
        <h2>Congratulations {name}!</h2>
        <p>You have been selected to move to the next stage of the recruitment process for <strong>{job_title}</strong> at {settings.company_name}.</p>
        <div class="meta">
          <p style="margin:0 0 4px"><strong>Next Stage: AI-Powered Voice Interview</strong></p>
          <p style="margin:0 0 4px;font-size:13px">You will be asked a series of questions by our AI interviewer. The interview covers topics relevant to the role and is designed to assess your fit comprehensively.</p>
        </div>
        <p><strong>What to expect:</strong></p>
        <ul style="color:#4a4a6a;font-size:14px;line-height:1.8;padding-left:20px">
          <li>An AI interviewer will ask you questions one topic at a time.</li>
          <li>You will respond by speaking, just like a real conversation.</li>
          <li>The interview takes approximately {(settings.topic_time_limit_seconds * 4) // 60} minutes.</li>
        </ul>
        <p><strong>Before you begin:</strong></p>
        <ul style="color:#4a4a6a;font-size:14px;line-height:1.8;padding-left:20px">
          <li>Use a <strong>desktop or laptop computer</strong> for the best experience (not a mobile phone).</li>
          <li>Ensure you are in a <strong>quiet environment</strong> with minimal background noise.</li>
          <li>You need a <strong>working microphone</strong> and a <strong>stable internet connection</strong>.</li>
          <li>Supported browsers: Chrome, Firefox, Edge, Safari (latest versions).</li>
        </ul>
        <p>Click the button below to begin your AI interview:</p>
        <p style="text-align:center"><a href="{magic_link}" class="button">Start Your AI Interview</a></p>
        {expiry_html}
        <hr class="hr">
        <p style="font-size:13px;color:#8888a0">If the button does not work, copy and paste this link into your browser:<br><a href="{magic_link}" style="color:{settings.brand_color};word-break:break-all">{magic_link}</a></p>
        """
    elif stage == 2:
        subject = f"Great news {name}! You've been invited for a final interview"
        body = f"""
        <h2>Congratulations {name}!</h2>
        <p>You have successfully passed the AI assessment stage for <strong>{job_title}</strong> at {settings.company_name}.</p>
        <p>Our HR team will contact you shortly to schedule the final interview. We look forward to speaking with you further about this opportunity.</p>
        """
    else:
        return

    await send_email(to, subject, _branded_template(body))


async def send_stage2_invitation_email(
    to: str, name: str, job_title: str, magic_link: str,
    expires_at: datetime | None = None,
):
    subject = f"Congratulations {name}! You've advanced to the AI Interview"
    expiry_html = ""
    if expires_at:
        expiry_str = expires_at.strftime("%B %d, %Y at %I:%M %p %Z")
        expiry_html = f'<p style="color:#dc2626;font-size:13px;font-weight:600">⚠ This invitation expires on <strong>{expiry_str}</strong>. Complete your assessment before this date.</p>'

    duration_min = (settings.topic_time_limit_seconds * 4) // 60
    body = f"""
    <h2>Congratulations {name}!</h2>
    <p>You have been selected to proceed to the next stage of our recruitment process for <strong>{job_title}</strong> at {settings.company_name}.</p>
    <p>The next stage is an <strong>AI-powered voice interview</strong>. It is a conversational assessment where our AI interviewer will ask you questions about key topics relevant to this role.</p>

    <div class="meta">
      <p style="margin:0 0 6px;font-weight:700;color:{settings.brand_color}">Interview Overview</p>
      <p style="margin:0 0 2px"><strong>Duration:</strong> Approximately {duration_min} minutes</p>
      <p style="margin:0 0 2px"><strong>Format:</strong> Voice-based conversation with AI</p>
      <p style="margin:0"><strong>Topics:</strong> Several role-relevant topics will be discussed</p>
    </div>

    <p><strong>For the best experience:</strong></p>
    <ul style="color:#4a4a6a;font-size:14px;line-height:1.8;padding-left:20px">
      <li>Use a <strong>desktop or laptop computer</strong>. Mobile phones and tablets are not supported.</li>
      <li>Find a <strong>quiet environment</strong> free from interruptions.</li>
      <li>Ensure you have a <strong>working microphone</strong> and <strong>speakers or headphones</strong>. Headphones are recommended.</li>
      <li>A <strong>stable internet connection</strong> is required for the voice interview.</li>
      <li>Supported browsers: Chrome, Firefox, Edge, Safari (latest versions).</li>
    </ul>

    <div class="meta" style="border-left:3px solid #dc2626">
      <p style="margin:0 0 6px;font-weight:700;color:#dc2626">Assessment Integrity Policy</p>
      <p style="margin:0 0 8px;font-size:13px;color:#4a4a6a">To keep this assessment fair for everyone, please read this carefully before you begin:</p>
      <ul style="color:#4a4a6a;font-size:13px;line-height:1.8;padding-left:20px;margin:0">
        <li>Stay on the interview page for the entire session. If you switch tabs, open another window, or minimize the browser, the interview will end immediately.</li>
        <li>The AI interviewer only discusses the interview questions. It will not answer unrelated questions and will not respond to attempts to change its behavior or bypass the assessment.</li>
        <li>Complete the interview yourself, in one sitting, without outside assistance.</li>
      </ul>
      <p style="margin:8px 0 0;font-size:13px;color:#4a4a6a">If your session ends unexpectedly, contact our HR team at <a href="mailto:HR@mswitchgroup.com" style="color:{settings.brand_color}">HR@mswitchgroup.com</a> and we will help you sort it out.</p>
    </div>

    {expiry_html}

    <p style="text-align:center"><a href="{magic_link}" class="button">Begin Your AI Interview</a></p>

    <hr class="hr">
    <p style="font-size:13px;color:#8888a0">If the button does not work, copy and paste this link:<br><a href="{magic_link}" style="color:{settings.brand_color};word-break:break-all">{magic_link}</a></p>
    <p style="font-size:12px;color:#aaa;margin-top:12px">This link will expire and can only be used once. Please complete the assessment in one sitting.</p>
    """

    await send_email(to, subject, _branded_template(body))


async def send_rejection_email(to: str, name: str, job_title: str, stage: int):
    subject = f"Update on your application for {job_title}"
    body = f"""
    <h2>Thank you for your interest, {name}.</h2>
    <p>After careful review, we regret to inform you that you have not been selected to proceed to the next stage for <strong>{job_title}</strong> at {settings.company_name}.</p>
    <p>We appreciate the time and effort you put into your application and wish you the best in your future endeavors.</p>
    """

    await send_email(to, subject, _branded_template(body))


async def send_interview_invitation_email(
    to: str, name: str, job_title: str,
    interview_date: str, interview_time: str,
    interview_type: str, location_or_link: str,
    interviewer: str = "", notes: str = "",
    contact_email: str = "",
):
    subject = f"Interview Invitation for {job_title} at {settings.company_name}"
    type_badge = "📹 Virtual" if interview_type.lower() == "virtual" else "📍 Physical"
    location_html = f"<p><strong>Location:</strong> {location_or_link}</p>" if interview_type.lower() == "physical" else f'<p><strong>Meeting Link:</strong> <a href="{location_or_link}" style="color:{settings.brand_color}">{location_or_link}</a></p>'
    notes_html = f"<p><strong>Preparation Notes:</strong> {notes}</p>" if notes else ""
    interviewer_html = f"<p><strong>Interviewer:</strong> {interviewer}</p>" if interviewer else ""
    contact = contact_email or settings.sender_email

    body = f"""
    <h2>Congratulations {name}!</h2>
    <p>We are pleased to invite you to the final interview stage for <strong>{job_title}</strong> at {settings.company_name}.</p>

    <div class="meta">
      <p style="margin:0 0 2px"><strong>Date:</strong> {interview_date}</p>
      <p style="margin:0 0 2px"><strong>Time:</strong> {interview_time}</p>
      <p style="margin:0 0 2px"><strong>Type:</strong> {type_badge}</p>
      {interviewer_html}
      {location_html}
      {notes_html}
    </div>

    <p>Please confirm your availability by replying to this email. If you need to reschedule, let us know at least 24 hours in advance.</p>
    <p>If you have any questions, please contact us at <a href="mailto:{contact}" style="color:{settings.brand_color}">{contact}</a>.</p>
    <p>We look forward to speaking with you!</p>
    """

    await send_email(to, subject, _branded_template(body))


async def send_new_application_notification(
    candidate_name: str, candidate_email: str, job_title: str,
    application_id: str, screening_score: float | None = None,
):
    recipients = [e.strip() for e in settings.hr_notification_email.split(",") if e.strip()]
    if not recipients:
        logger.warning("HR_NOTIFICATION_EMAIL not configured — skipping new-applicant alert")
        return

    dashboard_link = f"{settings.frontend_url}/hr/applicants/{application_id}"
    score_html = (
        f'<p style="margin:0 0 2px"><strong>AI Screening Score:</strong> {screening_score:.0f}/100</p>'
        if screening_score is not None
        else '<p style="margin:0 0 2px;color:#dc2626"><strong>AI screening did not complete.</strong> Please review manually.</p>'
    )
    subject = f"New Applicant: {candidate_name} for {job_title}"
    body = f"""
    <h2>New application received</h2>
    <p>A new candidate has applied for <strong>{job_title}</strong>.</p>
    <div class="meta">
      <p style="margin:0 0 2px"><strong>Candidate:</strong> {candidate_name}</p>
      <p style="margin:0 0 2px"><strong>Email:</strong> {candidate_email}</p>
      {score_html}
    </div>
    <p style="text-align:center"><a href="{dashboard_link}" class="button">Review Application</a></p>
    """

    for to in recipients:
        await send_email(to, subject, _branded_template(body))


async def send_application_received_email(to: str, name: str, job_title: str):
    subject = f"We've received your application for {job_title}"
    body = f"""
    <h2>Thank you, {name}!</h2>
    <p>We've successfully received your application for <strong>{job_title}</strong> at {settings.company_name}.</p>
    <p>Our team will review your application and reach out if you are shortlisted for the next stage.</p>
    """

    await send_email(to, subject, _branded_template(body))


async def send_hr_invite_email(to: str, name: str, set_password_link: str):
    subject = f"You've been added to {settings.company_name}'s HR Portal"
    body = f"""
    <h2>Welcome, {name}!</h2>
    <p>You've been added as an HR team member on the {settings.company_name} recruitment platform.</p>
    <p>Click the button below to set your password and sign in:</p>
    <p style="text-align:center"><a href="{set_password_link}" class="button">Set Your Password</a></p>
    <hr class="hr">
    <p style="font-size:13px;color:#8888a0">If the button does not work, copy and paste this link into your browser:<br><a href="{set_password_link}" style="color:{settings.brand_color};word-break:break-all">{set_password_link}</a></p>
    <p style="font-size:12px;color:#aaa;margin-top:12px">This link expires in 1 hour. If you did not expect this invitation, you can ignore this email.</p>
    """

    await send_email(to, subject, _branded_template(body))


async def send_password_reset_email(to: str, name: str, reset_link: str):
    subject = f"Reset your {settings.company_name} HR Portal password"
    body = f"""
    <h2>Hi {name},</h2>
    <p>We received a request to reset your password for the {settings.company_name} HR Portal.</p>
    <p style="text-align:center"><a href="{reset_link}" class="button">Reset Password</a></p>
    <hr class="hr">
    <p style="font-size:13px;color:#8888a0">If the button does not work, copy and paste this link into your browser:<br><a href="{reset_link}" style="color:{settings.brand_color};word-break:break-all">{reset_link}</a></p>
    <p style="font-size:12px;color:#aaa;margin-top:12px">This link expires in 1 hour. If you did not request this, you can safely ignore this email. Your password will not be changed.</p>
    """

    await send_email(to, subject, _branded_template(body))


async def send_expired_link_notification(to: str, name: str, job_title: str):
    subject = f"Assessment Link Expired: {job_title}"
    body = f"""
    <h2>Hi {name},</h2>
    <p>The assessment link for <strong>{job_title}</strong> at {settings.company_name} has expired.</p>
    <p>If you would still like to be considered for this position, please contact our HR team, and we will arrange a new assessment invitation.</p>
    <p>We apologise for any inconvenience.</p>
    """

    await send_email(to, subject, _branded_template(body))
