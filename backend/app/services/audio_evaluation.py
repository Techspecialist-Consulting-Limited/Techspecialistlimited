import json

from openai import AsyncAzureOpenAI

from app.config import settings

EVALUATION_PROMPT = """You are an expert interviewer evaluating a candidate's audio response. Assess their answer against the job context and instructions.

Job Title: {job_title}
Evaluation Instructions: {instructions}
Question: {question}

Candidate's Transcript:
{transcript}

Return a JSON object with:
- score: number 0-100
- strengths: comma-separated list of key strengths in the response
- weaknesses: comma-separated list of gaps or areas to improve
- feedback: 2-3 sentence detailed feedback
- recommendation: "approve", "review", or "reject"
"""


async def transcribe_audio(audio_data: bytes, filename: str) -> str:
    client = AsyncAzureOpenAI(
        api_key=settings.azure_whisper_key,
        api_version=settings.azure_whisper_api_version,
        azure_endpoint=settings.azure_whisper_endpoint,
    )

    transcript = await client.audio.transcriptions.create(
        model=settings.whisper_deployment_name,
        file=(filename, audio_data),
    )

    return transcript.text


async def evaluate_transcript(
    job_title: str,
    instructions: str,
    question: str,
    transcript: str,
) -> dict:
    client = AsyncAzureOpenAI(
        api_key=settings.azure_openai_key,
        api_version=settings.azure_openai_api_version,
        azure_endpoint=settings.azure_openai_endpoint,
    )

    response = await client.chat.completions.create(
        model=settings.gpt4o_deployment_name,
        messages=[
            {
                "role": "system",
                "content": "You return only valid JSON. No markdown.",
            },
            {
                "role": "user",
                "content": EVALUATION_PROMPT.format(
                    job_title=job_title,
                    instructions=instructions,
                    question=question,
                    transcript=transcript,
                ),
            },
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )

    return json.loads(response.choices[0].message.content)
