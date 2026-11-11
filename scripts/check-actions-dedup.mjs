#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
const stage = readFileSync('.github/workflows/pages-stage.yml', 'utf8');
const publish = readFileSync('.github/workflows/pages-publish.yml', 'utf8');
const daily = readFileSync('.github/workflows/cinema-catalog-daily.yml', 'utf8');
const stagingScript = readFileSync('scripts/publish-pages.sh', 'utf8');
const previewNotifier = readFileSync('scripts/post-preview-link.sh', 'utf8');

// CI is for PRs. The staging workflow validates main after pushes.
assert.match(ci, /on:\s*\n\s*pull_request:/, 'PR CI trigger is missing');
assert.doesNotMatch(ci.split('permissions:')[0], /^\s*push:/m, 'Main push must not duplicate CI builds');
assert.match(ci, /cancel-in-progress: true/, 'Superseded PR CI must be cancelled');

assert.match(stage, /group: cinema-pages-stage/, 'Pages staging needs a shared writer lock');
assert.match(stage, /cancel-in-progress: false/, 'Do not interrupt a gh-pages write');
assert.match(stage, /queue: max/, 'Distinct PR closures must not be lost from the queue');
assert.match(stage, /id: gate/, 'Stage event/commit dedup gate missing');
assert.match(stage, /read_marker/, 'Stage should compare previously staged commit');
assert.match(stage, /steps\.gate\.outputs\.run == 'true'/, 'Build must respect the gate');
assert.match(stage, /actions: write/, 'Publisher dispatch permission missing');

assert.match(publish, /^\s+workflow_dispatch:/m, 'Publisher needs dispatch-only trigger');
assert.doesNotMatch(publish, /workflow_run:/, 'Publisher must not run on no-op staging success');
assert.match(publish, /group: cinema-pages-publish/, 'Publisher needs serial deployment');
assert.match(publish, /preview_pr:/, 'Publisher should accept a PR number from staging');
assert.match(publish, /preview_sha:/, 'Publisher should accept the exact preview commit');
assert.match(publish, /issues: write/, 'Trusted notifier needs permission to post issue comments');
assert.match(publish, /pull-requests: write/, 'Notifier must be authorized to write PR comments');
assert.match(publish, /notify:\s*\n/, 'A separate notification job must exist');
assert.match(publish, /needs: deploy/, 'Notifier must wait for successful Pages deployment');
assert.match(publish, /name: github-pages-\$\{\{ github\.run_attempt \}\}/, 'Publisher must give each retry a distinct artifact name');
assert.match(publish, /artifact_name: github-pages-\$\{\{ github\.run_attempt \}\}/, 'Deploy must target the artifact from its own attempt');
assert.match(publish, /Wait for Pages artifact metadata/, 'Publisher must wait for artifact indexing before deployment');
assert.match(publish, /needs\.deploy\.result == 'success'/, 'Notifier must not run after failed Pages deployment');
assert.ok(publish.indexOf('Post or update PR preview link') > publish.indexOf('uses: actions/deploy-pages@v4'), 'Never notify before Pages successfully deploys');
assert.match(publish, /bash automation\/scripts\/post-preview-link\.sh/, 'Notifier must come from the trusted branch');

assert.match(stagingScript, /\.eplus-production-sha/, 'Production marker not saved');
assert.match(stagingScript, /\.eplus-preview-sha/, 'PR preview marker not saved');
assert.match(stagingScript, /No gh-pages changes; no Pages publish dispatched/, 'No-op stage must not dispatch publish');
assert.match(stagingScript, /gh workflow run pages-publish\.yml --ref main/, 'Changed stage must dispatch publish');
assert.match(stagingScript, /-f preview_pr="\$PR_NUMBER" -f preview_sha="\$PR_HEAD_SHA"/, 'Staging must send PR identity to trusted publisher');
assert.match(stagingScript, /-f preview_pr="" -f preview_sha=""/, 'Production and preview deletion must pass empty optional inputs without interactive prompts');
assert.match(previewNotifier, /\.eplus-preview-sha/, 'Notifier must reject stale staging commits');
assert.match(previewNotifier, /\.head\.repo\.full_name/, 'Notifier must refuse external PR code');
assert.match(previewNotifier, /github-actions\[bot\]/, 'Only marked bot comments may be updated');
assert.match(previewNotifier, /--method PATCH/, 'Notifier should update previous bot comments');
assert.match(previewNotifier, /--method POST/, 'Notifier should create one bot comment when absent');
assert.match(previewNotifier, /Preview notifier: checking PR/, 'Notifier must identify the failing API stage in logs');
assert.match(previewNotifier, /Preview notifier: creating bot comment/, 'Comment creation stage must be observable');
assert.match(previewNotifier, /discovering open PRs for idempotent backfill/, 'Production publish should backfill current open PR previews');
assert.match(previewNotifier, /\.head\.sha/, 'Backfill must use current PR head');

assert.match(daily, /group: cinema-catalog-daily/, 'Catalog refresh concurrency missing');
assert.match(daily, /steps\.due\.outputs\.due == 'true'/, 'Same-day refresh guard missing');
assert.match(daily, /git rebase origin\/main/, 'Concurrent main update recovery missing');
assert.match(daily, /gh workflow run pages-stage\.yml --ref main/, 'GITHUB_TOKEN commit needs explicit stage dispatch');
assert.equal((daily.match(/cron:/g) || []).length, 1, 'Catalog must have one scheduled cron');

console.log('PASS: CI, staging, publishing and catalog dedup invariants');
