import json
import re
from typing import Awaitable, Callable

from openai import AsyncAzureOpenAI

from app.config import settings

_MESSAGE_VALUE_RE = re.compile(r'"message"\s*:\s*"((?:[^"\\]|\\.)*)"')


def _try_extract_message(buffer: str) -> str | None:
    """Pull the value of the "message" key out of a partial JSON buffer,
    as soon as its closing quote has streamed in — without waiting for the
    rest of the JSON object (action, topic_index) to finish."""
    match = _MESSAGE_VALUE_RE.search(buffer)
    if not match:
        return None
    try:
        return json.loads(f'"{match.group(1)}"')
    except json.JSONDecodeError:
        return None

INTERVIEWER_SYSTEM_PROMPT = """You are an expert interviewer conducting a voice interview for a {job_title} position.

EVALUATION FOCUS: {instructions}

INTERVIEW STRUCTURE:
You have a list of topics to cover. For each topic, you have a seed question to start with.
After the candidate responds, decide whether to:
(a) Ask a follow-up to probe deeper — if their answer is vague, interesting, or you want more detail
(b) Move to the next topic — if the answer is sufficient or the candidate clearly cannot go deeper
(c) End the interview — only after all topics are covered

RULES:
- Speak naturally and conversationally, as in a real interview
- Keep your responses SHORT (1-3 sentences max) — this will be spoken aloud via TTS
- Do not repeat back what the candidate just said
- When transitioning topics, briefly acknowledge their answer first
- Ask at most {max_turns_per_topic} questions per topic before moving on
- Be professional but encouraging

TOPICS:
{topics_json}

CURRENT STATE:
- Current topic index: {current_topic_index}
- Turns on current topic: {turns_on_current_topic}
- Topics remaining: {topics_remaining}

Respond with JSON:
{{"message": "what you say to the candidate", "action": "follow_up" | "next_topic" | "end_interview", "topic_index": <number>}}"""

EVALUATION_PROMPT = """You are evaluating a complete voice interview transcript for a {job_title} position.

Evaluation Instructions: {instructions}

Topics covered: {topic_labels}

Full transcript:
{formatted_transcript}

Return a JSON object with:
- score: overall interview score 0-100
- communication_skills: score 0-100 evaluating clarity, articulation, and active listening
- technical_competency: score 0-100 evaluating domain knowledge and relevant expertise
- confidence_professionalism: score 0-100 evaluating poise, composure, and professional demeanor
- problem_solving: score 0-100 evaluating analytical thinking and structured approach
- relevance_of_responses: score 0-100 evaluating how directly and thoroughly answers address questions
- strengths: comma-separated list of key strengths demonstrated
- weaknesses: comma-separated list of gaps or concerns
- feedback: 3-5 sentence detailed assessment of the candidate's performance
- recommendation: "approve", "review", or "reject"
- overall_recommendation: "highly_recommended", "recommended", "consider", or "not_recommended"
- per_topic_scores: [{{"topic": "label", "score": 0-100, "summary": "one sentence assessment"}}]
- key_strengths: list of 2-3 specific standout qualities
- areas_for_improvement: list of 2-3 specific development areas
- interview_summary: 2-3 sentence executive summary of the candidate's interview performance"""


def _get_client():
    return AsyncAzureOpenAI(
        api_key=settings.azure_openai_key,
        api_version=settings.azure_openai_api_version,
        azure_endpoint=settings.azure_openai_endpoint,
    )


async def _call_gpt(system_prompt: str, history: list[dict]) -> dict:
    messages = [
        {
            "role": "system",
            "content": "You return only valid JSON. No markdown.",
        },
        {"role": "system", "content": system_prompt},
    ]
    for entry in history:
        messages.append(
            {
                "role": "assistant" if entry["role"] == "ai" else "user",
                "content": entry["content"],
            }
        )

    client = _get_client()
    response = await client.chat.completions.create(
        model=settings.gpt4o_deployment_name,
        messages=messages,
        response_format={"type": "json_object"},
        temperature=0.3,
    )
    return json.loads(response.choices[0].message.content)


async def start_conversation(
    job_title: str,
    instructions: str,
    candidate_name: str,
    topics: list[dict],
) -> tuple[str, list[dict]]:
    system_prompt = INTERVIEWER_SYSTEM_PROMPT.format(
        job_title=job_title,
        instructions=instructions,
        max_turns_per_topic=settings.max_turns_per_topic,
        topics_json=json.dumps(topics, indent=2),
        current_topic_index=0,
        turns_on_current_topic=0,
        topics_remaining=len(topics),
    )

    greeting_prompt = {
        "role": "user",
        "content": f"Start the interview with {candidate_name}. Greet them and ask the first topic's seed question naturally. First topic: {topics[0]['label']}. Seed question: {topics[0]['seed_question']}",
    }

    result = await _call_gpt(system_prompt, [greeting_prompt])

    message = result["message"]
    topic_index = result.get("topic_index", 0)

    history = [
        {
            "role": "ai",
            "content": message,
            "topic_label": topics[topic_index]["label"],
        }
    ]

    return message, history


def _finalize_response(
    result: dict,
    updated_history: list[dict],
    topics: list[dict],
    current_topic_index: int,
    turns_on_current_topic: int,
    max_turns_per_topic: int,
) -> tuple[str, str, int, int, bool, list[dict]]:
    message = result["message"]
    action = result.get("action", "follow_up")
    new_topic_index = result.get("topic_index", current_topic_index)

    turns_on_current_topic += 1

    if turns_on_current_topic >= max_turns_per_topic:
        action = "next_topic"

    if action == "next_topic":
        new_topic_index = current_topic_index + 1
        turns_on_current_topic = 0

    is_done = False
    if action == "end_interview":
        is_done = True
    elif new_topic_index >= len(topics):
        is_done = True
        action = "end_interview"

    updated_history.append(
        {
            "role": "ai",
            "content": message,
            "topic_label": topics[min(new_topic_index, len(topics) - 1)]["label"],
        }
    )

    return message, action, new_topic_index, turns_on_current_topic, is_done, updated_history


def _build_response_prompt(
    job_title: str,
    instructions: str,
    topics: list[dict],
    current_topic_index: int,
    turns_on_current_topic: int,
    max_turns_per_topic: int,
) -> str:
    return INTERVIEWER_SYSTEM_PROMPT.format(
        job_title=job_title,
        instructions=instructions,
        max_turns_per_topic=max_turns_per_topic,
        topics_json=json.dumps(topics, indent=2),
        current_topic_index=current_topic_index,
        turns_on_current_topic=turns_on_current_topic + 1,
        topics_remaining=len(topics) - current_topic_index,
    )


async def process_candidate_response(
    conversation_history: list[dict],
    candidate_transcript: str,
    job_title: str,
    instructions: str,
    topics: list[dict],
    current_topic_index: int,
    turns_on_current_topic: int,
    max_turns_per_topic: int,
) -> tuple[str, str, int, int, bool, list[dict]]:
    updated_history = conversation_history + [
        {
            "role": "candidate",
            "content": candidate_transcript,
            "topic_label": topics[current_topic_index]["label"],
        }
    ]

    system_prompt = _build_response_prompt(
        job_title, instructions, topics, current_topic_index, turns_on_current_topic, max_turns_per_topic
    )

    prompt = {
        "role": "user",
        "content": "The candidate just responded. Decide what to do next based on their answer.",
    }

    result = await _call_gpt(system_prompt, updated_history + [prompt])

    return _finalize_response(
        result, updated_history, topics, current_topic_index, turns_on_current_topic, max_turns_per_topic
    )


async def process_candidate_response_streaming(
    conversation_history: list[dict],
    candidate_transcript: str,
    job_title: str,
    instructions: str,
    topics: list[dict],
    current_topic_index: int,
    turns_on_current_topic: int,
    max_turns_per_topic: int,
    on_message_ready: Callable[[str], Awaitable[None]],
) -> tuple[str, str, int, int, bool, list[dict]]:
    """Same as process_candidate_response, but streams the GPT completion and
    invokes on_message_ready(message_text) as soon as the "message" field has
    fully arrived — well before the trailing action/topic_index fields finish —
    so the caller can start TTS/audio playback immediately instead of waiting
    for the whole JSON object."""
    updated_history = conversation_history + [
        {
            "role": "candidate",
            "content": candidate_transcript,
            "topic_label": topics[current_topic_index]["label"],
        }
    ]

    system_prompt = _build_response_prompt(
        job_title, instructions, topics, current_topic_index, turns_on_current_topic, max_turns_per_topic
    )

    prompt = {
        "role": "user",
        "content": "The candidate just responded. Decide what to do next based on their answer.",
    }

    messages = [
        {"role": "system", "content": "You return only valid JSON. No markdown."},
        {"role": "system", "content": system_prompt},
    ]
    for entry in updated_history + [prompt]:
        messages.append(
            {
                "role": "assistant" if entry["role"] == "ai" else "user",
                "content": entry["content"],
            }
        )

    client = _get_client()
    stream = await client.chat.completions.create(
        model=settings.gpt4o_deployment_name,
        messages=messages,
        response_format={"type": "json_object"},
        temperature=0.3,
        stream=True,
    )

    buffer = ""
    message_sent = False
    async for chunk in stream:
        delta = chunk.choices[0].delta.content if chunk.choices else None
        if not delta:
            continue
        buffer += delta
        if not message_sent:
            extracted = _try_extract_message(buffer)
            if extracted is not None:
                message_sent = True
                await on_message_ready(extracted)

    result = json.loads(buffer)

    if not message_sent:
        # Fallback: regex never matched (unexpected key order/formatting) — the
        # caller still needs its message played, just without the early start.
        await on_message_ready(result["message"])

    return _finalize_response(
        result, updated_history, topics, current_topic_index, turns_on_current_topic, max_turns_per_topic
    )


async def evaluate_full_conversation(
    conversation_history: list[dict],
    job_title: str,
    instructions: str,
    topics: list[dict],
) -> dict:
    formatted_lines = []
    for entry in conversation_history:
        role = "AI" if entry["role"] == "ai" else "Candidate"
        formatted_lines.append(f"{role}: {entry['content']}")

    formatted_transcript = "\n".join(formatted_lines)
    topic_labels = [t["label"] for t in topics]

    system_prompt = EVALUATION_PROMPT.format(
        job_title=job_title,
        instructions=instructions,
        topic_labels=", ".join(topic_labels),
        formatted_transcript=formatted_transcript,
    )

    client = _get_client()
    response = await client.chat.completions.create(
        model=settings.gpt4o_deployment_name,
        messages=[
            {
                "role": "system",
                "content": "You return only valid JSON. No markdown.",
            },
            {"role": "user", "content": system_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )

    return json.loads(response.choices[0].message.content)
