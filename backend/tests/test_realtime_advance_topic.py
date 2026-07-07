"""Standalone sanity checks for realtime_interviewer.advance_topic — no live
Azure calls. Run directly: python tests/test_realtime_advance_topic.py"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.realtime_interviewer import advance_topic  # noqa: E402

TOPICS = [{"label": "Topic A"}, {"label": "Topic B"}, {"label": "Topic C"}]
MAX_TURNS = 4


def check(name, actual, expected):
    assert actual == expected, f"{name}: expected {expected}, got {actual}"
    print(f"  OK: {name}")


# follow_up stays on the same topic, turn count increments
check(
    "follow_up on topic 0",
    advance_topic("follow_up", 0, current_topic_index=0, turns_on_current_topic=0, topics=TOPICS, max_turns_per_topic=MAX_TURNS),
    (0, 1, False, "follow_up"),
)

# next_topic advances index and resets turn count
check(
    "next_topic from 0 -> 1",
    advance_topic("next_topic", 1, current_topic_index=0, turns_on_current_topic=2, topics=TOPICS, max_turns_per_topic=MAX_TURNS),
    (1, 0, False, "next_topic"),
)

# hitting max_turns_per_topic forces next_topic even if model said follow_up
check(
    "forced next_topic at max turns",
    advance_topic("follow_up", 0, current_topic_index=0, turns_on_current_topic=3, topics=TOPICS, max_turns_per_topic=MAX_TURNS),
    (1, 0, False, "next_topic"),
)

# next_topic past the last topic marks the interview done
check(
    "next_topic past last topic -> done",
    advance_topic("next_topic", 3, current_topic_index=2, turns_on_current_topic=1, topics=TOPICS, max_turns_per_topic=MAX_TURNS),
    (3, 0, True, "end_interview"),
)

# explicit end_interview marks done regardless of topic index
check(
    "explicit end_interview -> done",
    advance_topic("end_interview", 1, current_topic_index=1, turns_on_current_topic=1, topics=TOPICS, max_turns_per_topic=MAX_TURNS),
    (1, 2, True, "end_interview"),
)

print("\nAll advance_topic checks passed.")
