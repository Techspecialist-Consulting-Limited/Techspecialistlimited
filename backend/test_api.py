import httpx

BASE = "http://127.0.0.1:8000"

# Create job
job = httpx.post(f"{BASE}/api/jobs", json={
    "title": "Senior Engineer",
    "description": "Looking for senior engineer",
    "requirements": "5+ years Python",
    "screening_instructions": "Focus on Python experience",
    "stage2_instructions": "",
    "stage2_questions": ["Q1", "Q2"],
}).json()
print("Job created:", job["id"])

# Submit application
with open("test_cv.txt", "w") as f:
    f.write("Senior Python developer with 10 years experience")

with open("test_cv.txt", "rb") as f:
    resp = httpx.post(
        f"{BASE}/api/applications?job_id={job['id']}&candidate_name=John+Doe&candidate_email=john@example.com",
        headers={"x-api-key": "dev-api-key-123"},
        files={"cv": ("cv.txt", f, "text/plain")},
    )
    print("Status:", resp.status_code)
    if resp.status_code in (200, 201):
        app = resp.json()
        print("App created:", app["id"])
    else:
        print("Error:", resp.text)

# Check screening result
import time
time.sleep(2)

apps = httpx.get(f"{BASE}/api/hr/applications/{job['id']}").json()
print(f"\nApplicants ({len(apps)}):")
for a in apps:
    print(f"  - {a['candidate_name']}: score={a['screening']['overall_score'] if a['screening'] else 'N/A'}, status={a['status']}")
    if a.get('screening'):
        print(f"    Strengths: {a['screening']['strengths']}")
        print(f"    Concerns: {a['screening']['concerns']}")

# Approve the application
if apps:
    app_id = apps[0]["id"]
    review = httpx.post(f"{BASE}/api/hr/review/{app_id}", json={"action": "approve"}).json()
    print(f"\nReview result: {review}")
    print(f"  Assessment token: {apps[0].get('assessment_token', 'N/A')}")
