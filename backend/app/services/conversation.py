import json

from openai import AsyncAzureOpenAI

from app.config import settings

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
- score: overall score 0-100
- strengths: comma-separated list of key strengths demonstrated
- weaknesses: comma-separated list of gaps or concerns
- feedback: 3-5 sentence detailed assessment of the candidate's performance
- recommendation: "approve", "review", or "reject"
- per_topic_scores: [{{"topic": "label", "score": 0-100, "summary": "one sentence assessment"}}]"""


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

    system_prompt = INTERVIEWER_SYSTEM_PROMPT.format(
        job_title=job_title,
        instructions=instructions,
        max_turns_per_topic=max_turns_per_topic,
        topics_json=json.dumps(topics, indent=2),
        current_topic_index=current_topic_index,
        turns_on_current_topic=turns_on_current_topic + 1,
        topics_remaining=len(topics) - current_topic_index,
    )

    prompt = {
        "role": "user",
        "content": "The candidate just responded. Decide what to do next based on their answer.",
    }

    result = await _call_gpt(system_prompt, updated_history + [prompt])

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
