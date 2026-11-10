#!/usr/bin/env bash
set -euo pipefail

# Stage static files for the full GitHub Pages site, including independent PR previews.
: "${GITHUB_REPOSITORY:?GitHub repository is required}"
: "${GITHUB_TOKEN:?A scoped Actions token is required}"
: "${PAGES_DEPLOY_KIND:?Production, preview, or delete-preview must be selected}"

# Check again after the build: a PR may close or main may advance mid-build.
# A stale run must never restore an old preview or overwrite a new production.
case "$PAGES_DEPLOY_KIND" in
  production)
    current_main="$(gh api "repos/${GITHUB_REPOSITORY}/git/ref/heads/main" --jq '.object.sha')"
    if [[ "$current_main" != "$GITHUB_SHA" ]]; then
      echo "Skipped stale production build ($GITHUB_SHA -> $current_main)"
      exit 0
    fi
    ;;
  preview)
    pr_json="$(gh api "repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}")"
    if [[ "$(jq -r '.state' <<< "$pr_json")" != "open" ||
          "$(jq -r '.head.sha' <<< "$pr_json")" != "${PR_HEAD_SHA:-}" ]]; then
      echo "Skipped outdated or closed PR #$PR_NUMBER"
      exit 0
    fi
    ;;
  delete-preview)
    pr_state="$(gh api "repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}" --jq '.state')"
    if [[ "$pr_state" == "open" ]]; then
      echo "Skipped deletion; PR #$PR_NUMBER reopened"
      exit 0
    fi
    ;;
esac

repo_url="https://github.com/${GITHUB_REPOSITORY}.git"
branch_dir="${RUNNER_TEMP:-/tmp}/eplus-cinema-gh-pages"
site_dir=".site-publish"

rm -rf "$branch_dir" "$site_dir"
mkdir -p "$branch_dir" "$site_dir"
git -C "$branch_dir" init -q
git -C "$branch_dir" remote add origin "$repo_url"

if git -C "$branch_dir" ls-remote --exit-code origin refs/heads/gh-pages >/dev/null 2>&1; then
  git -C "$branch_dir" fetch --depth=1 origin refs/heads/gh-pages
  git -C "$branch_dir" checkout -q -b gh-pages FETCH_HEAD
else
  git -C "$branch_dir" checkout -q --orphan gh-pages
fi

case "$PAGES_DEPLOY_KIND" in
  production)
    test -f dist/index.html
    # Remove obsolete production files but retain previews and a configured CNAME.
    rsync -a --delete \
      --exclude='.git/' \
      --exclude='/previews/' \
      --exclude='/CNAME' \
      --exclude='/.nojekyll' \
      --exclude='/.eplus-production-sha' \
      dist/ "$branch_dir/"
    printf '%s\n' "$GITHUB_SHA" > "$branch_dir/.eplus-production-sha"
    echo "Staged production site at commit $GITHUB_SHA"
    ;;
  preview|delete-preview)
    : "${PR_NUMBER:?PR number is required}"
    [[ "$PR_NUMBER" =~ ^[1-9][0-9]*$ ]] || { echo "Invalid PR number"; exit 1; }
    destination="$branch_dir/previews/pr-${PR_NUMBER}"
    if [[ "$PAGES_DEPLOY_KIND" == preview ]]; then
      test -f dist/index.html
      mkdir -p "$destination"
      rsync -a --delete dist/ "$destination/"
      printf '%s\n' "$PR_HEAD_SHA" > "$destination/.eplus-preview-sha"
      echo "Staged preview at previews/pr-${PR_NUMBER} ($PR_HEAD_SHA)"
    else
      rm -rf -- "$destination"
      echo "Removed preview for closed PR #${PR_NUMBER}"
    fi
    ;;
  *)
    echo "Unexpected deploy kind: $PAGES_DEPLOY_KIND" >&2
    exit 1
    ;;
esac

touch "$branch_dir/.nojekyll"
git -C "$branch_dir" config user.name "github-actions[bot]"
git -C "$branch_dir" config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git -C "$branch_dir" add -A
if ! git -C "$branch_dir" diff --cached --quiet; then
  git -C "$branch_dir" commit -m "deploy: update ${PAGES_DEPLOY_KIND} ${PR_NUMBER:-main}" >/dev/null
  # The token is never present during npm install or the build.
  git -C "$branch_dir" push \
    "https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git" \
    HEAD:refs/heads/gh-pages

  # On main, the publisher is dispatched only for actual gh-pages mutations.
  # Before this PR merges, the default branch still uses workflow_run; do not
  # try to dispatch a trigger it does not yet expose.
  publisher="$(gh api "repos/${GITHUB_REPOSITORY}/contents/.github/workflows/pages-publish.yml?ref=main" --jq '.content' | base64 --decode)"
  if grep -Eq '^[[:space:]]*workflow_dispatch:' <<< "$publisher"; then
    # When main supports preview metadata, the trusted publisher will notify
    # the corresponding PR only after a successful Pages deployment.
    # Backwards compatibility: the PR version may run before this change merges.
    if [[ "$PAGES_DEPLOY_KIND" == preview ]] && grep -Eq '^[[:space:]]*preview_pr:' <<< "$publisher"; then
      gh workflow run pages-publish.yml --ref main -f preview_pr="$PR_NUMBER" -f preview_sha="$PR_HEAD_SHA"
    else
      if grep -Eq '^[[:space:]]*preview_pr:' <<< "$publisher"; then
        # Supply optional inputs explicitly to avoid GitHub CLI prompts on CI.
        gh workflow run pages-publish.yml --ref main -f preview_pr="" -f preview_sha=""
      else
        gh workflow run pages-publish.yml --ref main
      fi
    fi
    echo "Dispatched exactly one Pages publish for this staged change"
  else
    echo "Legacy workflow_run publisher on main handles the PR preview until merge"
  fi
else
  echo "No gh-pages changes; no Pages publish dispatched"
fi

# No .git metadata or token in the upload artifact.
rsync -a --exclude='/.git/' "$branch_dir/" "$site_dir/"
echo "Prepared Pages output at $site_dir"
