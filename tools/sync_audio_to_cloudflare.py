import argparse
import json
import mimetypes
import os
import shutil
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

DEFAULT_BUCKET = "mimilisten-audio"
DEFAULT_CACHE_CONTROL = "public, max-age=31536000, immutable"
DEFAULT_MAX_BYTES = 100 * 1024 * 1024
DEFAULT_MAX_FILES = 200
AUDIO_FIELDS = {"audioUrl", "sentenceAudioUrl", "monologueAudioUrl"}
DATA_FILES = [Path("data/questions.json"), Path("data/long-listening.json")]
SOURCE_FOLDERS = {
    "chunks": ["チャンク集", "chunks"],
    "sentences": ["文", "sentences"],
    "monologues": ["モノローグ", "monologues"],
    "long-monologues": ["長めモノローグ", "long-monologues", "モノローグ"],
}


def project_root() -> Path:
    return Path(__file__).resolve().parents[1]


def default_source_root() -> Path:
    return Path(os.environ.get("USERPROFILE", str(Path.home()))) / "Desktop" / "音源集"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def is_audio_value(value: str) -> bool:
    lower = value.lower()
    return lower.endswith((".mp3", ".wav", ".m4a", ".ogg"))


def object_key_from_value(value: str, public_base_url: str = "") -> str | None:
    if not isinstance(value, str) or not is_audio_value(value):
        return None
    if value.startswith("audio/"):
        return value.removeprefix("audio/")
    base = public_base_url.rstrip("/")
    if base and value.startswith(base + "/"):
        return value[len(base) + 1 :]
    if value.startswith("http://") or value.startswith("https://"):
        return urlparse(value).path.lstrip("/")
    return None


def collect_audio_refs(data, public_base_url: str = "") -> set[str]:
    refs: set[str] = set()

    def walk(node):
        if isinstance(node, dict):
            for key, value in node.items():
                if key in AUDIO_FIELDS:
                    object_key = object_key_from_value(value, public_base_url)
                    if object_key:
                        refs.add(object_key)
                walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(data)
    return refs


def update_audio_urls(data, public_base_url: str) -> int:
    updated = 0
    base = public_base_url.rstrip("/")

    def walk(node):
        nonlocal updated
        if isinstance(node, dict):
            for key, value in list(node.items()):
                if key in AUDIO_FIELDS:
                    object_key = object_key_from_value(value, public_base_url)
                    if object_key:
                        next_value = f"{base}/{object_key}"
                        if node[key] != next_value:
                            node[key] = next_value
                            updated += 1
                else:
                    walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(data)
    return updated


def source_candidates(root: Path, source_root: Path, object_key: str) -> list[Path]:
    key_path = Path(*object_key.split("/"))
    filename = key_path.name
    group = object_key.split("/", 1)[0]
    candidates = [
        source_root / key_path,
    ]
    for folder in SOURCE_FOLDERS.get(group, []):
        candidates.append(source_root / folder / filename)
    candidates.append(source_root / filename)
    candidates.append(root / "audio" / key_path)
    return candidates


def resolve_source(root: Path, source_root: Path, object_key: str) -> Path | None:
    for candidate in source_candidates(root, source_root, object_key):
        if candidate.exists() and candidate.is_file():
            return candidate
    return None


def npx_command() -> str:
    return shutil.which("npx.cmd") or shutil.which("npx") or "npx"


def wrangler_command(args: list[str]) -> list[str]:
    return [npx_command(), "--yes", "wrangler", *args]


def run_command(cmd: list[str], dry_run: bool):
    printable = " ".join(f'"{part}"' if " " in part else part for part in cmd)
    print(printable)
    if dry_run:
        return
    subprocess.run(cmd, check=True)


def content_type_for(path: Path) -> str:
    guessed, _ = mimetypes.guess_type(path.name)
    if guessed:
        return guessed
    if path.suffix.lower() == ".mp3":
        return "audio/mpeg"
    if path.suffix.lower() == ".wav":
        return "audio/wav"
    return "application/octet-stream"


def build_plan(root: Path, source_root: Path, public_base_url: str, limit_files: int = 0):
    refs: set[str] = set()
    for data_file in DATA_FILES:
        data_path = root / data_file
        if data_path.exists():
            refs.update(collect_audio_refs(load_json(data_path), public_base_url))

    selected_refs = sorted(refs)
    total_refs = len(selected_refs)
    if limit_files > 0:
        selected_refs = selected_refs[:limit_files]

    plan = []
    missing = []
    for object_key in selected_refs:
        source = resolve_source(root, source_root, object_key)
        if source:
            plan.append(
                {
                    "key": object_key.replace("\\", "/"),
                    "source": source,
                    "size": source.stat().st_size,
                    "content_type": content_type_for(source),
                }
            )
        else:
            missing.append(object_key)
    return plan, missing, total_refs


def write_manifest(path: Path, plan, public_base_url: str):
    base = public_base_url.rstrip("/")
    manifest = [
        {
            "key": item["key"],
            "source": str(item["source"]),
            "size": item["size"],
            "contentType": item["content_type"],
            "url": f"{base}/{item['key']}" if base else "",
        }
        for item in plan
    ]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Sync listening drill audio files to Cloudflare R2.")
    parser.add_argument("--bucket", default=DEFAULT_BUCKET)
    parser.add_argument("--source-root", type=Path, default=default_source_root())
    parser.add_argument("--public-base-url", default="")
    parser.add_argument("--upload", action="store_true", help="Upload files. Default is dry-run only.")
    parser.add_argument("--create-bucket", action="store_true", help="Create the R2 bucket before uploading.")
    parser.add_argument("--enable-r2-dev-url", action="store_true", help="Enable r2.dev public URL for test use.")
    parser.add_argument("--set-cors", action="store_true", help="Apply cloudflare/r2-cors.public-read.json.")
    parser.add_argument("--update-json", action="store_true", help="Rewrite data JSON audio URLs to the public base URL.")
    parser.add_argument("--write-manifest", type=Path, help="Write a local upload manifest JSON.")
    parser.add_argument("--limit-files", type=int, default=0, help="Process only the first N audio refs for a small test run.")
    parser.add_argument("--max-bytes", type=int, default=DEFAULT_MAX_BYTES)
    parser.add_argument("--max-files", type=int, default=DEFAULT_MAX_FILES)
    parser.add_argument("--cache-control", default=DEFAULT_CACHE_CONTROL)
    args = parser.parse_args()

    root = project_root()
    source_root = args.source_root.expanduser()
    dry_run = not args.upload
    plan, missing, total_refs = build_plan(root, source_root, args.public_base_url, args.limit_files)
    total_bytes = sum(item["size"] for item in plan)

    print(f"Project: {root}")
    print(f"Source root: {source_root}")
    print(f"Bucket: {args.bucket}")
    print(f"Mode: {'UPLOAD' if args.upload else 'DRY RUN'}")
    if args.limit_files > 0:
        print(f"Files: {len(plan)} selected from {total_refs} refs / Total: {total_bytes / 1024 / 1024:.3f} MB")
    else:
        print(f"Files: {len(plan)} / Total: {total_bytes / 1024 / 1024:.3f} MB")
    print(f"Safety limits: {args.max_files} files / {args.max_bytes / 1024 / 1024:.3f} MB")

    if missing:
        print("\nMissing audio sources:")
        for item in missing:
            print(f"  - {item}")
        return 2

    if len(plan) > args.max_files:
        print(f"\nAbort: file count exceeds safety limit ({args.max_files} files).")
        return 5

    if total_bytes > args.max_bytes:
        print(f"\nAbort: upload size exceeds safety limit ({args.max_bytes} bytes).")
        return 3

    if args.create_bucket:
        run_command(wrangler_command(["r2", "bucket", "create", args.bucket]), dry_run)

    if args.enable_r2_dev_url:
        run_command(wrangler_command(["r2", "bucket", "dev-url", "enable", args.bucket]), dry_run)

    if args.set_cors:
        cors_path = root / "cloudflare" / "r2-cors.public-read.json"
        run_command(wrangler_command(["r2", "bucket", "cors", "set", args.bucket, "--file", str(cors_path)]), dry_run)

    print("\nObjects:")
    for item in plan:
        print(f"  {item['source']} -> {args.bucket}/{item['key']}")
        if args.upload:
            run_command(
                wrangler_command(
                    [
                        "r2",
                        "object",
                        "put",
                        f"{args.bucket}/{item['key']}",
                        "--file",
                        str(item["source"]),
                        "--content-type",
                        item["content_type"],
                        "--cache-control",
                        args.cache_control,
                        "--remote",
                    ]
                ),
                dry_run=False,
            )

    if args.write_manifest:
        write_manifest(root / args.write_manifest, plan, args.public_base_url)
        print(f"\nWrote manifest: {root / args.write_manifest}")

    if args.update_json:
        if not args.public_base_url:
            print("\nAbort: --update-json requires --public-base-url.")
            return 4
        for data_file in DATA_FILES:
            path = root / data_file
            if not path.exists():
                continue
            data = load_json(path)
            count = update_audio_urls(data, args.public_base_url)
            if count:
                save_json(path, data)
            print(f"Updated {data_file}: {count} URLs")

    return 0


if __name__ == "__main__":
    sys.exit(main())
