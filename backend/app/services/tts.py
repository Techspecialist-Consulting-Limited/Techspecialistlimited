from openai import AsyncAzureOpenAI

from app.config import settings


async def synthesize_speech(text: str) -> bytes:
    if settings.dev_mode and not settings.azure_tts_endpoint:
        return b""

    client = AsyncAzureOpenAI(
        api_key=settings.azure_tts_key or settings.azure_openai_key,
        api_version=settings.azure_tts_api_version,
        azure_endpoint=settings.azure_tts_endpoint or settings.azure_openai_endpoint,
    )

    response = await client.audio.speech.create(
        model=settings.tts_deployment_name,
        voice=settings.tts_voice,
        input=text,
        response_format="mp3",
    )

    return response.content
