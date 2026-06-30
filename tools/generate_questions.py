# -*- coding: utf-8 -*-
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SEED_PATH = ROOT / "data" / "question-seeds.json"
OUTPUT_PATH = ROOT / "data" / "questions.json"
REQUIRED_SEED_FIELDS = [
    "id",
    "roundId",
    "soundType",
    "weaknessTag",
    "audioUrl",
    "answer",
    "visibleForm",
    "kana",
    "point",
    "distractors",
]


def read_json(path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def validate_seed(seed):
    missing = [field for field in REQUIRED_SEED_FIELDS if not seed.get(field)]
    if missing:
        raise ValueError(f"{seed.get('id', 'unknown')} missing: {', '.join(missing)}")
    if len(seed["distractors"]) != 3:
        raise ValueError(f"{seed['id']} must have exactly 3 distractors.")
    seen = {seed["answer"]}
    for distractor in seed["distractors"]:
        text = distractor.get("text", "")
        if not text:
            raise ValueError(f"{seed['id']} has an empty distractor.")
        if text in seen:
            raise ValueError(f"{seed['id']} has duplicated choice: {text}")
        seen.add(text)


def audio_exists(path_text):
    return (ROOT / path_text).exists()


def build_question(seed, existing_by_id):
    previous = existing_by_id.get(seed["id"], {})
    status = seed.get("reviewStatus") or previous.get("reviewStatus") or "pending"
    quality = seed.get("qualityStatus") or previous.get("qualityStatus") or "unchecked"
    choices = [{"text": seed["answer"], "correct": True}]
    for distractor in seed["distractors"]:
        choices.append(
            {
                "text": distractor["text"],
                "correct": False,
                "weaknessTag": distractor.get("weaknessTag", seed["weaknessTag"]),
                "reason": distractor.get("reason", ""),
            }
        )
    question = {
        "id": seed["id"],
        "roundId": seed["roundId"],
        "questionType": seed.get("questionType", "similar_choice"),
        "reviewStatus": status,
        "qualityStatus": quality,
        "soundType": seed["soundType"],
        "weaknessTag": seed["weaknessTag"],
        "audioUrl": seed["audioUrl"],
        "answer": seed["answer"],
        "visibleForm": seed["visibleForm"],
        "kana": seed["kana"],
        "point": seed["point"],
        "choices": choices,
    }
    for optional_field in [
        "sentenceAudioUrl",
        "monologueAudioUrl",
        "practiceText",
        "sentenceText",
        "monologueText",
        "targetChunk",
        "meaningJa",
        "answerKana",
        "kanaChoices",
        "highlightChunks",
        "monologueHighlightChunks",
    ]:
        if seed.get(optional_field):
            question[optional_field] = seed[optional_field]
    return question


def main():
    seeds = read_json(SEED_PATH, [])
    existing = read_json(OUTPUT_PATH, [])
    existing_by_id = {item["id"]: item for item in existing if "id" in item}
    questions = []
    ids = set()
    missing_audio = []
    for seed in seeds:
        validate_seed(seed)
        if seed["id"] in ids:
            raise ValueError(f"duplicated id: {seed['id']}")
        ids.add(seed["id"])
        question = build_question(seed, existing_by_id)
        for field in ["audioUrl", "sentenceAudioUrl", "monologueAudioUrl"]:
            if question.get(field) and not audio_exists(question[field]):
                missing_audio.append(f"{question['id']} {field}: {question[field]}")
        questions.append(question)
    if missing_audio:
        raise FileNotFoundError("\n".join(missing_audio))
    OUTPUT_PATH.write_text(json.dumps(questions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("generated: data/questions.json")
    print(f"questions: {len(questions)}")


if __name__ == "__main__":
    main()
