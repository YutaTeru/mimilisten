import argparse
import json
import sys
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

AUDIO_FIELDS = {"audioUrl", "sentenceAudioUrl", "monologueAudioUrl"}
DATA_FILES = [Path("data/questions.json"), Path("data/long-listening.json")]
AUDIO_SIGNATURES = {
    b"ID3": "audio/mpeg",
    b"RIFF": "audio/wav",
    b"OggS": "audio/ogg",
    b"ftyp": "audio/mp4",
}


def project_root() -> Path:
    return Path(__file__).resolve().parents[1]


def walk_audio_urls(node):
    if isinstance(node, dict):
        for key, value in node.items():
            if key in AUDIO_FIELDS and isinstance(value, str):
                yield value
            else:
                yield from walk_audio_urls(value)
    elif isinstance(node, list):
        for item in node:
            yield from walk_audio_urls(item)


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def collect_urls(root: Path):
    urls = []
    for data_file in DATA_FILES:
        path = root / data_file
        if not path.exists():
            continue
        data = load_json(path)
        urls.extend(walk_audio_urls(data))
    return sorted(set(urls))


def collect_manifest_urls(root: Path, manifest_path: Path):
    path = manifest_path if manifest_path.is_absolute() else root / manifest_path
    data = load_json(path)
    urls = []
    for item in data:
        url = item.get("url", "")
        if url:
            urls.append(url)
    return sorted(set(urls))


def looks_like_audio(content_type: str, sample: bytes = b"") -> bool:
    if content_type.startswith("audio/"):
        return True
    if sample.startswith(b"\xff\xfb") or sample.startswith(b"\xff\xf3") or sample.startswith(b"\xff\xf2"):
        return True
    return any(sample.startswith(signature) for signature in AUDIO_SIGNATURES)


def response_result(url: str, response, method: str, sample: bytes = b""):
    content_type = response.headers.get("Content-Type", "")
    content_length = response.headers.get("Content-Length", "")
    ok = 200 <= response.status < 400 and looks_like_audio(content_type, sample)
    return {
        "url": url,
        "ok": ok,
        "status": response.status,
        "method": method,
        "contentType": content_type,
        "contentLength": content_length,
    }


def try_request(url: str, timeout: int, method: str, headers: dict[str, str] | None = None, read_sample: bool = False):
    request_headers = {
        "User-Agent": "MimiListenAudioVerifier/1.0",
        "Accept": "audio/*,*/*;q=0.8",
    }
    if headers:
        request_headers.update(headers)
    request = Request(url, headers=request_headers, method=method)
    with urlopen(request, timeout=timeout) as response:
        sample = response.read(64) if read_sample else b""
        return response_result(url, response, method, sample)


def check_url(url: str, timeout: int):
    if not url.startswith(("http://", "https://")):
        return {"url": url, "ok": False, "status": "local", "message": "not a public URL"}
    errors = []
    try:
        head_result = try_request(url, timeout, "HEAD")
        if head_result["ok"]:
            return head_result
        errors.append(f"HEAD {head_result['status']} {head_result.get('contentType', '')}".strip())
    except HTTPError as error:
        errors.append(f"HEAD {error.code} {error.reason}")
    except URLError as error:
        errors.append(f"HEAD network_error {error.reason}")

    try:
        get_result = try_request(url, timeout, "GET", {"Range": "bytes=0-63"}, read_sample=True)
        if get_result["ok"]:
            return get_result
        errors.append(f"GET {get_result['status']} {get_result.get('contentType', '')}".strip())
    except HTTPError as error:
        errors.append(f"GET {error.code} {error.reason}")
    except URLError as error:
        errors.append(f"GET network_error {error.reason}")

    return {"url": url, "ok": False, "status": "verify_failed", "message": "; ".join(errors)}


def main():
    parser = argparse.ArgumentParser(description="Verify public audio URLs from app JSON files.")
    parser.add_argument("--manifest", type=Path, help="Verify URLs from an audio sync manifest instead of app JSON.")
    parser.add_argument("--timeout", type=int, default=10)
    args = parser.parse_args()

    root = project_root()
    urls = collect_manifest_urls(root, args.manifest) if args.manifest else collect_urls(root)
    if not urls:
        print("No audio URLs found.")
        return 1

    failed = []
    for url in urls:
        result = check_url(url, args.timeout)
        marker = "OK" if result["ok"] else "NG"
        detail = result.get("contentType") or result.get("message", "")
        method = result.get("method", "-")
        print(f"{marker} {result['status']} {method} {url} {detail}")
        if not result["ok"]:
            failed.append(result)

    print(f"\nChecked: {len(urls)} / Failed: {len(failed)}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
