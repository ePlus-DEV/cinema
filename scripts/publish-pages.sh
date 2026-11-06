#!/usr/bin/env bash
set -euo pipefail

# Stage static files for the full GitHub Pages site, including independent PR previews.
: "${GITHUB_REPOSITORY:?GitHub repository is required}"
: "${GITHUB_TOKEN:?A scoped Actions token is required}"
: "${PAGES_DEPLOY_KIND:?Production, preview, or delete-preview must be selected}"

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
      dist/ "$branch_dir/"
    echo "Staged production site"
    ;;
  preview|delete-preview)
    : "${PR_NUMBER:?PR number is required}"
    [[ "$PR_NUMBER" =~ ^[1-9][0-9]*$ ]] || { echo "Invalid PR number"; exit 1; }
    destination="$branch_dir/previews/pr-${PR_NUMBER}"
    if [[ "$PAGES_DEPLOY_KIND" == preview ]]; then
      test -f dist/index.html
      mkdir -p "$destination"
      rsync -a --delete dist/ "$destination/"
      echo "Staged preview at previews/pr-${PR_NUMBER}"
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
else
  echo "No change in the Pages publication"
fi

# No .git metadata or token in the upload artifact.
rsync -a --exclude='/.git/' "$branch_dir/" "$site_dir/"
echo "Prepared Pages output at $site_dir"
