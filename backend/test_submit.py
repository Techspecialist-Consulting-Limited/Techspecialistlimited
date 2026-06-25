import httpx
import json

BASE = "http://127.0.0.1:8000"

job = httpx.post(f"{BASE}/api/jobs", json={
    "title": "Senior Engineer",
    "description": "Looking for senior engineer",
    "requirements": "5+ years Python",
    "screening_instructions": "Focus on Python experience",
    "stage2_instructions": "",
    "stage2_questions": ["Q1", "Q2"],
}).json()
print("Job created:", job["id"])

with open("test_cv.txt", "w") as f:
    f.write("Senior Python developer with 10 years experience")

with open("test_cv.txt", "rb") as f:
    resp = httpx.post(
        f"{BASE}/api/applications?job_id={job['id']}&candidate_name=John+Doe&candidate_email=john@example.com",
        headers={"x-api-key": "dev-api-key-123"},
        files={"cv": ("cv.txt", f, "text/plain")},
    )
    print(f"Status: {resp.status_code}")
    if resp.is_error:
        print(f"Error: {resp.text}")
    else:
        print(f"Response: {resp.json()}")
