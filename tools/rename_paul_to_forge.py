#!/usr/bin/env python3
"""
Case-preserving rename of 'paul' → 'forge' across text files.

Patterns (applied in order — specificity matters):
  1. /paul:             → /forge:            (slash command prefix, must win over bare 'paul')
  2. paul:              → forge:             (frontmatter name field: "paul:help" → "forge:help")
  3. .paul/             → .forge/            (state directory path)
  4. paul-framework     → forge-framework    (package name)
  5. PAUL               → FORGE              (all-caps)
  6. Paul               → Forge              (title case)
  7. paul               → forge              (lowercase — last, catches anything remaining)

Skips: binary files, files under .git/, node_modules/, assets/, tools/ (this script itself).
Renames file paths too: any file or directory whose name contains 'paul' is renamed.
"""
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SKIP_DIRS = {".git", "node_modules", "assets", "tools", "__pycache__"}
TEXT_EXTS = {".md", ".js", ".json", ".txt", ".yml", ".yaml", ".sh", ".ts", ".py"}

# Order matters: more specific patterns first.
PATTERNS = [
    (re.compile(r"/paul:"), "/forge:"),
    (re.compile(r"\bpaul:"), "forge:"),
    (re.compile(r"\.paul/"), ".forge/"),
    (re.compile(r"paul-framework"), "forge-framework"),
    (re.compile(r"paul_"), "forge_"),
    (re.compile(r"PAUL"), "FORGE"),
    (re.compile(r"Paul"), "Forge"),
    (re.compile(r"\bpaul\b"), "forge"),
]

def is_text_file(path: Path) -> bool:
    if path.suffix.lower() in TEXT_EXTS:
        return True
    # fallback: sniff first 4KB
    try:
        with open(path, "rb") as f:
            chunk = f.read(4096)
        if b"\0" in chunk:
            return False
        chunk.decode("utf-8")
        return True
    except (UnicodeDecodeError, OSError):
        return False

def should_skip_dir(name: str) -> bool:
    return name in SKIP_DIRS

def rewrite_text(text: str) -> str:
    for pat, repl in PATTERNS:
        text = pat.sub(repl, text)
    return text

FILE_PATTERNS = [
    (re.compile(r"paul-framework"), "forge-framework"),
    (re.compile(r"paul_"), "forge_"),
    (re.compile(r"PAUL"), "FORGE"),
    (re.compile(r"Paul"), "Forge"),
    (re.compile(r"\bpaul\b"), "forge"),
]

def rename_path_component(name: str) -> str:
    # Filenames can't contain '/' or ':', so we only apply the plain
    # word/case patterns — not the slash-prefixed or colon-suffixed ones.
    for pat, repl in FILE_PATTERNS:
        name = pat.sub(repl, name)
    return name

def main():
    changed_files = 0
    renamed_paths = 0

    # First pass: rewrite file contents (bottom-up walk to allow renaming after).
    for dirpath, dirnames, filenames in os.walk(ROOT, topdown=True):
        dirnames[:] = [d for d in dirnames if not should_skip_dir(d)]
        for fn in filenames:
            p = Path(dirpath) / fn
            if not is_text_file(p):
                continue
            try:
                original = p.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            rewritten = rewrite_text(original)
            if rewritten != original:
                p.write_text(rewritten, encoding="utf-8")
                changed_files += 1

    # Second pass: rename files and directories (bottom-up).
    for dirpath, dirnames, filenames in os.walk(ROOT, topdown=False):
        rel = Path(dirpath).relative_to(ROOT)
        if any(part in SKIP_DIRS for part in rel.parts):
            continue
        for fn in filenames:
            new_name = rename_path_component(fn)
            if new_name != fn:
                old = Path(dirpath) / fn
                new = Path(dirpath) / new_name
                old.rename(new)
                renamed_paths += 1
        for dn in dirnames:
            if should_skip_dir(dn):
                continue
            new_name = rename_path_component(dn)
            if new_name != dn:
                old = Path(dirpath) / dn
                new = Path(dirpath) / new_name
                old.rename(new)
                renamed_paths += 1

    print(f"content changes: {changed_files} files")
    print(f"path renames:    {renamed_paths} paths")

if __name__ == "__main__":
    main()
