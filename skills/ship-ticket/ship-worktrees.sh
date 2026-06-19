#!/usr/bin/env bash
# ship-worktrees.sh — manage one git worktree per repo for a single ticket.
#
# Usage:
#   ship-worktrees.sh [--dry-run] create  <TICKET> <TYPE> <repo>...
#   ship-worktrees.sh [--dry-run] cleanup <TICKET> <TYPE> [--keep-branch] <repo>...
#   ship-worktrees.sh            list     <TICKET> <repo>...
#
# Worktrees land at $HARNESS_ROOT/<TICKET>/<repo>, on branch <TYPE>/<TICKET>,
# branched from each repo's origin default branch. Repos resolve under $DEV_ROOT.
# --dry-run prints the git commands without running them.
set -euo pipefail

DEV_ROOT="${DEV_ROOT:-/Users/mdo/dev/420}"
HARNESS_ROOT="${HARNESS_ROOT:-$DEV_ROOT/.ship-worktrees}"

DRY=0
[ "${1:-}" = "--dry-run" ] && { DRY=1; shift; }

run() { if [ "$DRY" = 1 ]; then printf 'DRY  %s\n' "$*"; else printf '+ %s\n' "$*"; "$@"; fi; }

cmd="${1:-}"; shift || true
case "$cmd" in
  create)
    TICKET="${1:?ticket required}"; TYPE="${2:?type required}"; shift 2
    branch="$TYPE/$TICKET"
    [ "$#" -gt 0 ] || { echo "ERR: no repos given" >&2; exit 2; }
    for repo in "$@"; do
      r="$DEV_ROOT/$repo"; wt="$HARNESS_ROOT/$TICKET/$repo"
      [ -d "$r/.git" ] || { echo "ERR: $r is not a git repo" >&2; exit 1; }
      base="$(git -C "$r" symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##')"
      base="${base:-$(git -C "$r" rev-parse --abbrev-ref HEAD)}"
      run git -C "$r" fetch --quiet origin "$base"
      run git -C "$r" worktree add -b "$branch" "$wt" "origin/$base"
      printf '  %-26s -> %s   [%s from origin/%s]\n' "$repo" "$wt" "$branch" "$base"
    done
    ;;
  cleanup)
    TICKET="${1:?ticket required}"; TYPE="${2:?type required}"; shift 2
    KEEPB=0; [ "${1:-}" = "--keep-branch" ] && { KEEPB=1; shift; }
    branch="$TYPE/$TICKET"
    [ "$#" -gt 0 ] || { echo "ERR: no repos given" >&2; exit 2; }
    for repo in "$@"; do
      r="$DEV_ROOT/$repo"; wt="$HARNESS_ROOT/$TICKET/$repo"
      run git -C "$r" worktree remove --force "$wt" || true
      [ "$KEEPB" = 0 ] && run git -C "$r" branch -D "$branch" || true
    done
    [ "$DRY" = 1 ] || rmdir "$HARNESS_ROOT/$TICKET" 2>/dev/null || true
    ;;
  list)
    TICKET="${1:?ticket required}"; shift
    [ "$#" -gt 0 ] || { echo "ERR: no repos given" >&2; exit 2; }
    for repo in "$@"; do
      printf '== %s ==\n' "$repo"
      git -C "$DEV_ROOT/$repo" worktree list | grep -- "$TICKET" || echo "  (none)"
    done
    ;;
  *)
    echo "usage: ship-worktrees.sh [--dry-run] create|cleanup|list ..." >&2
    exit 2
    ;;
esac
