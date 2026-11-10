#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
const stage = readFileSync('.github/workflows/pages-stage.yml', 'utf8');
const publish = readFileSync('.github/workflows/pages-publish.yml', 'utf8');
const daily = readFileSync('.github/workflows/cinema-catalog-daily.yml', 'utf8');
const stagingScript = readFileSync('scripts/publish-pages.sh', 'utf8');

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

assert.match(stagingScript, /\.eplus-production-sha/, 'Production marker not saved');
assert.match(stagingScript, /\.eplus-preview-sha/, 'PR preview marker not saved');
assert.match(stagingScript, /No gh-pages changes; no Pages publish dispatched/, 'No-op stage must not dispatch publish');
assert.match(stagingScript, /gh workflow run pages-publish\.yml --ref main/, 'Changed stage must dispatch publish');

assert.match(daily, /group: cinema-catalog-daily/, 'Catalog refresh concurrency missing');
assert.match(daily, /steps\.due\.outputs\.due == 'true'/, 'Same-day refresh guard missing');
assert.match(daily, /git rebase origin\/main/, 'Concurrent main update recovery missing');
assert.match(daily, /gh workflow run pages-stage\.yml --ref main/, 'GITHUB_TOKEN commit needs explicit stage dispatch');
assert.equal((daily.match(/cron:/g) || []).length, 1, 'Catalog must have one scheduled cron');

console.log('PASS: CI, staging, publishing and catalog dedup invariants');
