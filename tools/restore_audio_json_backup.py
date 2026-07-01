import argparse
import shutil
import sys
from pathlib import Path


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

DEFAULT_BACKUP_DIR = Path("tools/audio-json-backups")
DATA_FILES = [Path("data/questions.json"), Path("data/long-listening.json")]


def project_root() -> Path:
    return Path(__file__).resolve().parents[1]


def resolve_backup_root(root: Path, backup_dir: Path, backup_name: str = "") -> Path:
    base = backup_dir if backup_dir.is_absolute() else root / backup_dir
    if backup_name:
        candidate = base / backup_name
        if not candidate.exists():
            raise FileNotFoundError(f"Backup not found: {candidate}")
        return candidate

    candidates = [item for item in base.iterdir() if item.is_dir()] if base.exists() else []
    if not candidates:
        raise FileNotFoundError(f"No JSON backups found in: {base}")
    return sorted(candidates)[-1]


def restore_from_backup(root: Path, backup_root: Path, dry_run: bool) -> int:
    restored = 0
    missing = []
    for data_file in DATA_FILES:
        source = backup_root / data_file
        target = root / data_file
        if not source.exists():
            missing.append(str(source))
            continue
        print(f"{'Would restore' if dry_run else 'Restoring'} {source} -> {target}")
        if not dry_run:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
        restored += 1

    if missing:
        print("\nMissing backup files:")
        for item in missing:
            print(f"  - {item}")

    print(f"\nRestored files: {restored}")
    return 0 if restored else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Restore app JSON files from an audio URL backup.")
    parser.add_argument("--backup-dir", type=Path, default=DEFAULT_BACKUP_DIR)
    parser.add_argument("--backup-name", default="", help="Specific timestamp folder under backup-dir. Defaults to latest.")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    root = project_root()
    try:
        backup_root = resolve_backup_root(root, args.backup_dir, args.backup_name)
    except FileNotFoundError as exc:
        print(str(exc))
        return 2

    print(f"Backup root: {backup_root}")
    return restore_from_backup(root, backup_root, args.dry_run)


if __name__ == "__main__":
    sys.exit(main())
