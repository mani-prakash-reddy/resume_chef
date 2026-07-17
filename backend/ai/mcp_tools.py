"""
FastMCP tool definitions for the Chat / Resume Agent.

Key design constraint:
  `resume_id` is NEVER exposed as an agent-fillable parameter.
  The backend injects it at request time from the authenticated user's session,
  binding the tool to the correct resume before handing it to the agent.
  This prevents the agent from accidentally reading/patching another user's resume.

Tools:
  - read_resume(starting_line, no_of_lines) → str
  - patch_resume(patches: list[Patch])      → dict
"""

from typing import Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Resume


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _add_line_numbers(content: str) -> str:
    """Prefix each line with its 1-indexed line number."""
    lines = content.splitlines()
    return "\n".join(f"{i + 1}: {line}" for i, line in enumerate(lines))


def _apply_patches(original_lines: list[str], patches: list[dict]) -> tuple[list[str], list[dict], list[dict]]:
    """
    Apply ordered patches to a list of lines.
    Line numbers in patches always reference the ORIGINAL file (not post-patch positions).

    Returns:
        (new_lines, succeeded_patches, failed_patches)
    """
    # Convert original_lines to a mutable working copy using an offset tracker.
    # We maintain a list of replacement tuples: (original_from, original_to, new_content_lines)
    # and apply them all at once at the end to avoid line-shift confusion.

    succeeded = []
    failed = []
    replacements: list[tuple[int, int, list[str]]] = []  # (from_0idx, to_0idx, replacement_lines)

    total_lines = len(original_lines)

    for patch in patches:
        try:
            from_line = int(patch["from"])  # 1-indexed
            to_line = int(patch["to"])      # 1-indexed, inclusive
            content = str(patch.get("content", ""))

            if from_line < 1 or to_line < from_line or to_line > total_lines:
                failed.append({**patch, "error": f"Line range {from_line}-{to_line} out of bounds (file has {total_lines} lines)"})
                continue

            replacement_lines = content.splitlines()
            replacements.append((from_line - 1, to_line - 1, replacement_lines))  # 0-indexed
            succeeded.append(patch)

        except (KeyError, TypeError, ValueError) as e:
            failed.append({**patch, "error": str(e)})

    if not replacements:
        return original_lines, succeeded, failed

    # Apply replacements from last to first (reverse order) to preserve 0-based indices.
    result = list(original_lines)
    for from_idx, to_idx, replacement_lines in sorted(replacements, key=lambda x: x[0], reverse=True):
        result[from_idx:to_idx + 1] = replacement_lines

    return result, succeeded, failed


# ---------------------------------------------------------------------------
# Tool factory — creates bound async callables with resume_id injected
# ---------------------------------------------------------------------------


def create_resume_tools(resume_id: str, db: AsyncSession):
    """
    Returns a dict of tool functions with `resume_id` already bound.
    The returned callables match the signatures the agent sees in its tool schema.
    """

    async def read_resume(
        starting_line: Optional[int] = None,
        no_of_lines: Optional[int] = None,
    ) -> str:
        """
        Read the current resume content with 1-indexed line numbers.

        Parameters (all optional):
          - starting_line: first line to read (1-indexed). Defaults to 1.
          - no_of_lines:   number of lines to return. Defaults to full file.

        Returns content prefixed with line numbers.
        If a partial read is performed, a footer is appended:
          [Lines X to Y of N total lines]
        so the agent always knows the full file size.
        """
        result = await db.execute(
            select(Resume).where(Resume.id == resume_id)
        )
        resume = result.scalar_one_or_none()
        if resume is None:
            return "ERROR: Resume not found."

        raw_content = resume.content_code or ""
        all_lines = raw_content.splitlines()
        total = len(all_lines)

        if total == 0:
            return "(resume is empty)"

        # Determine slice bounds (1-indexed, inclusive)
        start = max(1, starting_line or 1)
        if no_of_lines is not None:
            end = min(total, start + no_of_lines - 1)
        else:
            end = total

        selected_lines = all_lines[start - 1:end]
        numbered = "\n".join(f"{start + i}: {line}" for i, line in enumerate(selected_lines))

        if start != 1 or end != total:
            numbered += f"\n\n[Lines {start} to {end} of {total} total lines]"

        return numbered

    async def patch_resume(patches: list[dict]) -> dict:
        """
        Apply one or more line-range replacements to the resume in a single call.

        Each patch object:
          {"from": int, "to": int, "content": str}

        Rules:
          - from/to are inclusive line numbers referencing the ORIGINAL file.
          - Do NOT send overlapping ranges.
          - content may have a different line count than (to - from + 1).
          - Best-effort: succeeded patches are committed; failed ones are reported.
        """
        result = await db.execute(
            select(Resume).where(Resume.id == resume_id)
        )
        resume = result.scalar_one_or_none()
        if resume is None:
            return {"error": "Resume not found.", "succeeded": [], "failed": patches}

        original_lines = (resume.content_code or "").splitlines()
        new_lines, succeeded, failed = _apply_patches(original_lines, patches)

        if succeeded:
            new_content = "\n".join(new_lines)
            await db.execute(
                update(Resume)
                .where(Resume.id == resume_id)
                .values(content_code=new_content)
            )
            await db.commit()

        return {
            "succeeded": succeeded,
            "failed": failed,
            "lines_after_patch": len(new_lines),
        }

    return {
        "read_resume": read_resume,
        "patch_resume": patch_resume,
    }
