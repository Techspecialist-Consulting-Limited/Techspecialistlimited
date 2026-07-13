import uuid
from datetime import datetime, timedelta


def _fold(text: str) -> str:
    return text.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;").replace("\n", "\\n")


def build_interview_ics(
    summary: str,
    description: str,
    location: str,
    interview_date: str,
    interview_time: str,
    duration_minutes: int,
) -> str | None:
    try:
        start = datetime.strptime(f"{interview_date} {interview_time}", "%Y-%m-%d %H:%M")
    except ValueError:
        return None

    end = start + timedelta(minutes=duration_minutes)
    now = datetime.utcnow()
    uid = f"{uuid.uuid4()}@techspecialistlimited.com"

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//TechSpecialist//Recruitment//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{now.strftime('%Y%m%dT%H%M%SZ')}",
        f"DTSTART:{start.strftime('%Y%m%dT%H%M%S')}",
        f"DTEND:{end.strftime('%Y%m%dT%H%M%S')}",
        f"SUMMARY:{_fold(summary)}",
        f"DESCRIPTION:{_fold(description)}",
        f"LOCATION:{_fold(location)}",
        "STATUS:CONFIRMED",
        "END:VEVENT",
        "END:VCALENDAR",
    ]
    return "\r\n".join(lines)
