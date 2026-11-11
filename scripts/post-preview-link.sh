#!/usr/bin/env bash
set -euo pipefail

# Trusted main-branch helper. This job is gated on successful Pages deploy.
: "${GH_TOKEN:?}"
: "${GITHUB_REPOSITORY:?}"

notify_one() {
  local pr="$1" expected_sha="$2"
  local pr_json encoded staged_sha url short_sha body existing_id current_body
  [[ "$pr" =~ ^[1-9][0-9]*$ && "$expected_sha" =~ ^[0-9a-f]{40}$ ]] || {
    echo "Invalid preview PR or SHA" >&2
    return 1
  }

  echo "Preview notifier: checking PR #$pr HEAD and state"
  pr_json="$(gh api "repos/$GITHUB_REPOSITORY/pulls/$pr")"
  if [[ "$(jq -r '.state' <<< "$pr_json")" != open ||
        "$(jq -r '.head.repo.full_name' <<< "$pr_json")" != "$GITHUB_REPOSITORY" ||
        "$(jq -r '.head.sha' <<< "$pr_json")" != "$expected_sha" ]]; then
    echo "Skipping PR #$pr: closed, external, or stale head"
    return 0
  fi

  echo "Preview notifier: confirming staged SHA for PR #$pr"
  if ! encoded="$(gh api "repos/$GITHUB_REPOSITORY/contents/previews/pr-$pr/.eplus-preview-sha?ref=gh-pages" --jq '.content' 2>/dev/null)"; then
    echo "Skipping PR #$pr: no staged preview marker"
    return 0
  fi
  staged_sha="$(printf '%s' "$encoded" | base64 --decode)"
  if [[ "$staged_sha" != "$expected_sha" ]]; then
    echo "Skipping PR #$pr: preview was superseded"
    return 0
  fi

  url="https://cinema.eplus.dev/previews/pr-$pr/"
  short_sha="${expected_sha:0:7}"
  body="$(printf '%s\n\n%s\n\n%s\n\n%s\n' \
    '<!-- eplus-cinema-preview-link -->' \
    "### Xem trước PR #$pr" \
    "[Mở bản preview đã triển khai]($url)" \
    "GitHub Pages đã deploy thành công bản preview cho commit $short_sha. Preview là bản công khai và được xóa khi PR đóng.")"

  echo "Preview notifier: reading existing bot comments for PR #$pr"
  existing_id="$(gh api --paginate "repos/$GITHUB_REPOSITORY/issues/$pr/comments?per_page=100" \
    --jq '.[] | select(.user.login == "github-actions[bot]" and (.body // "" | contains("<!-- eplus-cinema-preview-link -->"))) | .id' \
    | awk 'NR == 1 {print}')"

  if [[ -n "$existing_id" ]]; then
    current_body="$(gh api "repos/$GITHUB_REPOSITORY/issues/comments/$existing_id" --jq '.body')"
    if [[ "$current_body" == "$body" ]]; then
      echo "Preview notifier: comment already current for PR #$pr"
    else
      echo "Preview notifier: updating existing bot comment for PR #$pr"
      gh api --method PATCH "repos/$GITHUB_REPOSITORY/issues/comments/$existing_id" -f body="$body" >/dev/null
    fi
  else
    echo "Preview notifier: creating bot comment for PR #$pr"
    gh api --method POST "repos/$GITHUB_REPOSITORY/issues/$pr/comments" -f body="$body" >/dev/null
  fi
  printf '%s\n' "Preview for PR #$pr: $url" >> "$GITHUB_STEP_SUMMARY"
}

if [[ -n "${PREVIEW_PR:-}" ]]; then
  notify_one "$PREVIEW_PR" "${PREVIEW_SHA:?}"
else
  echo "Preview notifier: discovering open PRs for idempotent backfill"
  prs="$(gh api --paginate "repos/$GITHUB_REPOSITORY/pulls?state=open&per_page=100" \
    --jq '.[] | [.number, .head.sha] | @tsv')"
  if [[ -n "$prs" ]]; then
    while IFS=$'\t' read -r number current_sha; do
      [[ -z "$number" ]] && continue
      notify_one "$number" "$current_sha"
    done <<< "$prs"
  fi
fi
