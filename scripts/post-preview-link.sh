#!/usr/bin/env bash
set -euo pipefail

# This helper only runs from the trusted main-branch Pages publisher, AFTER
# deploy-pages succeeds. Treat workflow_dispatch inputs as untrusted.
: "$GH_TOKEN"
: "$GITHUB_REPOSITORY"
: "$PREVIEW_PR"
: "$PREVIEW_SHA"

if [[ ! "$PREVIEW_PR" =~ ^[1-9][0-9]*$ || ! "$PREVIEW_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Invalid preview PR number or SHA" >&2
  exit 1
fi

echo "Preview notifier: checking PR #$PREVIEW_PR HEAD and state"
pr_json="$(gh api "repos/$GITHUB_REPOSITORY/pulls/$PREVIEW_PR")"
if [[ "$(jq -r '.state' <<< "$pr_json")" != open ||
      "$(jq -r '.head.repo.full_name' <<< "$pr_json")" != "$GITHUB_REPOSITORY" ||
      "$(jq -r '.head.sha' <<< "$pr_json")" != "$PREVIEW_SHA" ]]; then
  echo "Skipping PR notification: preview head is no longer current or PR is closed"
  exit 0
fi

# The published tree must still point at the exact PR HEAD for this dispatch.
# A later staging run might have replaced or deleted the preview already.
echo "Preview notifier: confirming staged SHA for PR #$PREVIEW_PR"
staged_sha="$(gh api "repos/$GITHUB_REPOSITORY/contents/previews/pr-$PREVIEW_PR/.eplus-preview-sha?ref=gh-pages" --jq '.content' | base64 --decode)"
if [[ "$staged_sha" != "$PREVIEW_SHA" ]]; then
  echo "Skipping PR notification: staged preview was superseded"
  exit 0
fi

url="https://cinema.eplus.dev/previews/pr-$PREVIEW_PR/"
short_sha="$(printf '%s' "$PREVIEW_SHA" | cut -c 1-7)"
marker='<!-- eplus-cinema-preview-link -->'
body="$(printf '%s\n\n%s\n\n%s\n\n%s\n' \
  "$marker" \
  "### Xem trước PR #$PREVIEW_PR" \
  "[Mở bản preview đã triển khai]($url)" \
  "GitHub Pages đã deploy thành công bản preview cho commit $short_sha. Preview là bản công khai và được xóa khi PR đóng.")"

# Reuse our own marked bot comment; never edit contributor or other bot text.
echo "Preview notifier: reading existing bot comments"
existing_id="$(gh api --paginate "repos/$GITHUB_REPOSITORY/issues/$PREVIEW_PR/comments?per_page=100" \
  --jq '.[] | select(.user.login == "github-actions[bot]" and (.body // "" | contains("<!-- eplus-cinema-preview-link -->"))) | .id' \
  | awk 'NR == 1 {print}')"
if [[ -n "$existing_id" ]]; then
  current_body="$(gh api "repos/$GITHUB_REPOSITORY/issues/comments/$existing_id" --jq '.body')"
  if [[ "$current_body" == "$body" ]]; then
    echo "Preview link comment already current for PR #$PREVIEW_PR"
  else
    echo "Preview notifier: updating existing bot comment"
    gh api --method PATCH "repos/$GITHUB_REPOSITORY/issues/comments/$existing_id" -f body="$body" >/dev/null
    echo "Updated preview link comment for PR #$PREVIEW_PR"
  fi
else
  echo "Preview notifier: creating bot comment"
  gh api --method POST "repos/$GITHUB_REPOSITORY/issues/$PREVIEW_PR/comments" -f body="$body" >/dev/null
  echo "Posted preview link to PR #$PREVIEW_PR"
fi

printf '%s\n' "Preview for PR #$PREVIEW_PR: $url" >> "$GITHUB_STEP_SUMMARY"
