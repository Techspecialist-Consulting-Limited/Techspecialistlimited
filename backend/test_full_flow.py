import httpx
import time

BASE = "http://127.0.0.1:8008"

# --- Create Job ---
job = httpx.post(f"{BASE}/api/jobs", json={
    "title": "Senior Software Engineer",
    "description": "Build AI-powered recruitment platform",
    "requirements": "5+ years Python, FastAPI, AI/ML, PostgreSQL",
    "screening_instructions": "Focus on Python experience, relevant projects, and leadership",
    "stage2_instructions": "Evaluate problem-solving and technical depth",
    "stage2_questions": [
        "Describe the most complex system you've built",
        "How do you ensure code quality?",
        "Explain your experience with AI/ML"
    ],
}).json()
print(f"[OK] Job: {job['id']} - {job['title']}")

# --- Submit Application ---
with open("test_cv.txt", "w") as f:
    f.write("""John Doe
Senior Python Developer | 8 years experience
- Led migration of monolith to microservices (FastAPI)
- Built ML pipeline processing 1M+ records/day
- Managed team of 5 engineers
- Strong experience with PostgreSQL, Redis, Azure
- Open source contributor""")

with open("test_cv.txt", "rb") as f:
    resp = httpx.post(
        f"{BASE}/api/applications?job_id={job['id']}&candidate_name=John+Doe&candidate_email=john@example.com",
        headers={"x-api-key": "dev-api-key-123"},
        files={"cv": ("cv.txt", f, "text/plain")},
    )
    assert resp.status_code in (200, 201), f"Submit failed: {resp.text}"
    app = resp.json()
    print(f"[OK] App: {app['id']} (status={app['status']})")

# --- Check Screening Result ---
time.sleep(2)

apps = httpx.get(f"{BASE}/api/hr/applications/{job['id']}").json()
print(f"[OK] {len(apps)} applicant(s)")

a = apps[0]
print(f"  Name: {a['candidate_name']}")
print(f"  Status: {a['status']}")
print(f"  Score: {a['screening']['overall_score']}/100")
print(f"  Strengths: {a['screening']['strengths']}")
print(f"  Concerns: {a['screening']['concerns']}")
print(f"  Evidence: {a['screening']['evidence']}")

# --- Approve ---
review = httpx.post(f"{BASE}/api/hr/review/{a['id']}", json={"action": "approve"}).json()
print(f"[OK] Review: status={review['status']}, stage={review['stage']}")

print("\n[OK] Full flow passed!")
