import json
import logging

from openai import AsyncAzureOpenAI

from app.config import settings

logger = logging.getLogger(__name__)

SCREENING_PROMPT = """You are an expert recruitment screener. Evaluate the candidate's CV and cover letter against the job requirements and instructions below.

Job Title: {job_title}
Job Requirements: {requirements}
Screening Instructions: {instructions}

Candidate CV:
{cv_text}

Cover Letter:
{cover_letter}

Return a JSON object with:
- overall_score: number 0-100
- strengths: comma-separated list of key strengths
- concerns: comma-separated list of concerns or gaps
- evidence: a plain string containing specific quotes or facts from the CV/cover letter that support your assessment, formatted as bullet points with "•" prefix. Do NOT return a JSON object or dict — return a plain string.
- recommendation: "approve", "review", or "reject"
"""


async def screen_application(
    job_title: str,
    requirements: str,
    instructions: str,
    cv_text: str,
    cover_letter_text: str | None,
) -> dict:
    try:
        client = AsyncAzureOpenAI(
            api_key=settings.azure_openai_key,
            api_version=settings.azure_openai_api_version,
            azure_endpoint=settings.azure_openai_endpoint,
        )

        cover_letter = cover_letter_text or "(No cover letter provided)"

        response = await client.chat.completions.create(
            model=settings.gpt4o_deployment_name,
            messages=[
                {
                    "role": "system",
                    "content": "You return only valid JSON. No markdown.",
                },
                {
                    "role": "user",
                    "content": SCREENING_PROMPT.format(
                        job_title=job_title,
                        requirements=requirements,
                        instructions=instructions,
                        cv_text=cv_text,
                        cover_letter=cover_letter,
                    ),
                },
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )

        result = json.loads(response.choices[0].message.content)
        logger.info(f"GPT-4o screening result: {result}")
        return result
    except Exception as e:
        logger.error(f"AI screening failed: {e}")
        return {
            "overall_score": 50,
            "strengths": "Unable to analyze — AI screening error",
            "concerns": f"Screening service error: {str(e)[:200]}",
            "evidence": "Automated screening encountered an error",
            "recommendation": "review",
        }
