import logging

from azure.communication.email.aio import EmailClient
from azure.core.credentials import AzureKeyCredential

from app.config import settings

logger = logging.getLogger(__name__)


def _parse_acs_connection(conn_str: str) -> tuple[str, str]:
    parts = dict(p.split("=", 1) for p in conn_str.split(";") if "=" in p)
    return parts["endpoint"], parts["accesskey"]


async def send_email(to: str, subject: str, html_content: str):
    if settings.dev_mode or not settings.acs_connection_string:
        logger.info(f"[DEV EMAIL] To: {to}")
        logger.info(f"[DEV EMAIL] Subject: {subject}")
        logger.info(f"[DEV EMAIL] Body: {html_content}")
        return

    try:
        endpoint, access_key = _parse_acs_connection(settings.acs_connection_string)
        client = EmailClient(endpoint=endpoint, credential=AzureKeyCredential(access_key))

        message = {
            "senderAddress": settings.sender_email,
            "recipients": {"to": [{"address": to}]},
            "content": {"subject": subject, "html": html_content},
        }

        async with client:
            poller = await client.begin_send(message)
            return await poller.result()
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")


async def send_approval_email(
    to: str, name: str, job_title: str, stage: int, magic_link: str = ""
):
    if stage == 1:
        subject = f"Congratulations {name}! You've advanced to Stage 2"
        content = f"""
        <h2>Congratulations {name}!</h2>
        <p>You have been selected to move to the next stage for <strong>{job_title}</strong>.</p>
        <p>Click the link below to start your audio assessment:</p>
        <p><a href="{magic_link}">{magic_link}</a></p>
        <p>You'll answer timed questions about the role. Good luck!</p>
        """
    elif stage == 2:
        subject = f"Great news {name}! You've been invited for a final interview"
        content = f"""
        <h2>Congratulations {name}!</h2>
        <p>You've successfully passed the assessment stage for <strong>{job_title}</strong>.</p>
        <p>Our HR team will contact you shortly to schedule the final physical interview.</p>
        """
    else:
        return

    await send_email(to, subject, content)


async def send_rejection_email(to: str, name: str, job_title: str, stage: int):
    subject = f"Update on your application for {job_title}"
    content = f"""
    <h2>Thank you for your interest, {name}.</h2>
    <p>After careful review, we regret to inform you that you have not been selected
    to proceed to the next stage for <strong>{job_title}</strong>.</p>
    <p>We appreciate the time and effort you put into your application and wish you
    the best in your future endeavors.</p>
    """

    await send_email(to, subject, content)
