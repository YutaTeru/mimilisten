# -*- coding: utf-8 -*-
import asyncio
import json
import re
from pathlib import Path

import edge_tts


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "long-listening.json"
DEFAULT_VOICE = "en-US-AriaNeural"
DEFAULT_RATE = "+0%"
DEFAULT_VOLUME = "+0%"


TOKEN_RE = re.compile(r"[A-Za-z0-9']+")


def normalize_token(value):
    return re.sub(r"[^a-z0-9']+", "", value.lower())


def transcript_tokens(text):
    return [
        {
            "text": match.group(0),
            "norm": normalize_token(match.group(0)),
            "start": match.start(),
            "end": match.end(),
        }
        for match in TOKEN_RE.finditer(text)
    ]


def chunk_occurrences(transcript, chunk):
    pattern = re.compile(re.escape(chunk), re.IGNORECASE)
    return [match.start() for match in pattern.finditer(transcript)]


def align_words(tokens, boundaries):
    aligned = []
    token_index = 0
    for boundary in boundaries:
      boundary_norm = normalize_token(boundary.get("text", ""))
      if not boundary_norm:
          continue
      while token_index < len(tokens) and tokens[token_index]["norm"] != boundary_norm:
          token_index += 1
      if token_index >= len(tokens):
          raise RuntimeError(f"単語境界を本文へ対応できません: {boundary.get('text')}")
      aligned.append({**tokens[token_index], **boundary})
      token_index += 1
    return aligned


def cue_for_chunk(item, tokens, aligned_words, chunk, start_index):
    chunk_end = start_index + len(chunk)
    token_indexes = [
        index
        for index, token in enumerate(tokens)
        if token["start"] >= start_index and token["end"] <= chunk_end
    ]
    if not token_indexes:
        raise RuntimeError(f"チャンクに対応する単語がありません: {chunk}")
    first_token = token_indexes[0]
    last_token = token_indexes[-1]
    if first_token >= len(aligned_words) or last_token >= len(aligned_words):
        raise RuntimeError(f"単語境界が不足しています: {chunk}")
    start = aligned_words[first_token]["startSeconds"]
    end = aligned_words[last_token]["endSeconds"]
    return {
        "chunk": chunk,
        "startIndex": start_index,
        "startSeconds": round(start, 3),
        "endSeconds": round(end, 3),
        "source": "wordBoundary",
    }


async def synthesize_with_boundaries(text, voice, output_path):
    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate=DEFAULT_RATE,
        volume=DEFAULT_VOLUME,
        boundary="WordBoundary",
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = output_path.with_suffix(output_path.suffix + ".tmp")
    boundaries = []
    received_audio = False
    try:
        with tmp_path.open("wb") as output_file:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio" and chunk.get("data"):
                    output_file.write(chunk["data"])
                    received_audio = True
                elif chunk["type"] == "WordBoundary":
                    offset = float(chunk["offset"]) / 10_000_000
                    duration = float(chunk["duration"]) / 10_000_000
                    boundaries.append(
                        {
                            "text": chunk.get("text", ""),
                            "startSeconds": offset,
                            "endSeconds": offset + duration,
                        }
                    )
        if not received_audio or tmp_path.stat().st_size <= 0:
            raise RuntimeError("音声データを受信できませんでした。")
        tmp_path.replace(output_path)
    finally:
        if tmp_path.exists():
            tmp_path.unlink()
    return boundaries


async def main():
    items = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    for item in items:
        transcript = item["transcript"]
        voice = item.get("voice") or DEFAULT_VOICE
        audio_path = BASE_DIR / item["audioUrl"]
        boundaries = await synthesize_with_boundaries(transcript, voice, audio_path)
        tokens = transcript_tokens(transcript)
        aligned_words = align_words(tokens, boundaries)
        cue_points = []
        missing = []
        for chunk in item.get("highlightChunks", []):
            starts = chunk_occurrences(transcript, chunk)
            if not starts:
                missing.append(chunk)
                continue
            for start_index in starts:
                cue_points.append(cue_for_chunk(item, tokens, aligned_words, chunk, start_index))
        if missing:
            raise RuntimeError(f"{item['id']} の本文にないチャンク: {', '.join(missing)}")
        item["voice"] = voice
        item["durationSeconds"] = round(boundaries[-1]["endSeconds"], 3) if boundaries else item.get("durationSeconds")
        item["cuePoints"] = sorted(cue_points, key=lambda cue: (cue["startIndex"], cue["chunk"]))
    DATA_PATH.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"updated {DATA_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
