import argparse
import shutil
import subprocess
import sys
from pathlib import Path

from sync_audio_to_cloudflare import (
    DEFAULT_BUCKET,
    DEFAULT_MAX_BYTES,
    DEFAULT_MAX_FILES,
    build_plan,
    default_source_root,
    npx_command,
    project_root,
)


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def run_capture(cmd: list[str], timeout: int = 60, cwd: Path | None = None) -> tuple[int, str]:
    try:
        completed = subprocess.run(
            cmd,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
            cwd=cwd,
        )
        return completed.returncode, (completed.stdout or "") + (completed.stderr or "")
    except FileNotFoundError as exc:
        return 127, str(exc)
    except subprocess.TimeoutExpired as exc:
        output = (exc.stdout or "") + (exc.stderr or "")
        return 124, output or "Command timed out."


def git_check_ignore(root: Path, path: str) -> bool | None:
    if not shutil.which("git"):
        return None
    code, _ = run_capture(["git", "check-ignore", "-q", path], timeout=20, cwd=root)
    return code == 0


def check_wrangler_login() -> tuple[bool | None, str]:
    code, output = run_capture([npx_command(), "--yes", "wrangler", "whoami"], timeout=90)
    if code == 127:
        return None, output
    if code == 0 and "not authenticated" not in output.lower():
        return True, output.strip()
    return False, output.strip()


def is_valid_public_base_url(value: str) -> bool:
    return value.startswith("https://") and "<" not in value and ">" not in value


def main() -> int:
    parser = argparse.ArgumentParser(description="Check whether local audio is ready for Cloudflare sync.")
    parser.add_argument("--bucket", default=DEFAULT_BUCKET)
    parser.add_argument("--source-root", type=Path, default=default_source_root())
    parser.add_argument("--public-base-url", default="")
    parser.add_argument("--limit-files", type=int, default=0)
    parser.add_argument("--max-bytes", type=int, default=DEFAULT_MAX_BYTES)
    parser.add_argument("--max-files", type=int, default=DEFAULT_MAX_FILES)
    parser.add_argument("--require-login", action="store_true")
    parser.add_argument("--require-public-base-url", action="store_true")
    parser.add_argument("--skip-login-check", action="store_true")
    args = parser.parse_args()

    root = project_root()
    source_root = args.source_root.expanduser()
    errors: list[str] = []
    warnings: list[str] = []

    print("Cloudflare audio readiness check")
    print(f"Project: {root}")
    print(f"Source root: {source_root}")
    print(f"Bucket: {args.bucket}")

    if not source_root.exists():
        errors.append(f"Audio source folder does not exist: {source_root}")

    plan, missing, total_refs = build_plan(root, source_root, args.public_base_url, args.limit_files)
    total_bytes = sum(item["size"] for item in plan)
    if args.limit_files > 0:
        print(f"Files: {len(plan)} selected from {total_refs} refs")
    else:
        print(f"Files: {len(plan)} refs")
    print(f"Size: {total_bytes / 1024 / 1024:.3f} MB")
    print(f"Safety limits: {args.max_files} files / {args.max_bytes / 1024 / 1024:.3f} MB")

    if missing:
        errors.append("Missing audio sources: " + ", ".join(missing))
    if len(plan) > args.max_files:
        errors.append(f"File count exceeds MaxFiles: {len(plan)} > {args.max_files}")
    if total_bytes > args.max_bytes:
        errors.append(f"Audio size exceeds MaxMB: {total_bytes} > {args.max_bytes}")

    if args.public_base_url:
        if not is_valid_public_base_url(args.public_base_url):
            errors.append("PublicBaseUrl must be a real https URL, not a placeholder.")
    elif args.require_public_base_url:
        errors.append("PublicBaseUrl is required for this check.")
    else:
        warnings.append("PublicBaseUrl is empty. Dry-run is fine, but UpdateJson needs the real Cloudflare URL.")

    audio_ignored = git_check_ignore(root, "audio/")
    if audio_ignored is False:
        errors.append("Project audio/ is not ignored by git.")
    elif audio_ignored is None:
        warnings.append("Could not check git ignore status.")
    else:
        print("Git ignore: audio/ is ignored")

    if not args.skip_login_check:
        logged_in, output = check_wrangler_login()
        if logged_in is True:
            print("Wrangler login: OK")
        elif logged_in is False:
            message = "Wrangler login: not authenticated"
            if args.require_login:
                errors.append(message)
            else:
                warnings.append(message)
            if output:
                print(output)
        else:
            message = "Wrangler login: could not run wrangler"
            if args.require_login:
                errors.append(message)
            else:
                warnings.append(message)
            if output:
                print(output)

    if warnings:
        print("\nWarnings:")
        for item in warnings:
            print(f"  - {item}")

    if errors:
        print("\nNot ready:")
        for item in errors:
            print(f"  - {item}")
        return 1

    print("\nReady for dry-run. For real upload, confirm Cloudflare free plan and use -Upload intentionally.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
