import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  findMissingRepositoryPrivateSources,
  REPOSITORY_PRIVATE_SOURCES,
  repositoryPrivateValidationFailures,
  resolveValidationContext
} from './validation-context.mjs';

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

function copyPublicValidatorSourceSet(destinationRoot) {
  const publicDirectories = ['a7-carpet-campaign', 'blog', 'public'];
  const privateRootFiles = new Set(['AGENTS.md', 'MANIFESTO.md', 'README.md', 'STRATEGY-PROMPT.md']);
  const privateShellAssets = ['assets/system/invoice/A7_LOGO_OFFICIAL_LIGHT_HORIZONTAL_V1.png'];

  for (const entry of fs.readdirSync(projectRoot, { withFileTypes: true })) {
    const source = path.join(projectRoot, entry.name);
    const destination = path.join(destinationRoot, entry.name);
    if (entry.isFile() && !entry.name.startsWith('.') && !privateRootFiles.has(entry.name)) {
      fs.copyFileSync(source, destination);
    } else if (entry.isDirectory() && publicDirectories.includes(entry.name)) {
      fs.cpSync(source, destination, { recursive: true });
    }
  }

  for (const relativePath of privateShellAssets) {
    const destination = path.join(destinationRoot, relativePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(projectRoot, relativePath), destination);
  }
}

function copyRepositoryPrivateSources(destinationRoot) {
  for (const relativePath of REPOSITORY_PRIVATE_SOURCES) {
    const destination = path.join(destinationRoot, relativePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(projectRoot, relativePath), destination);
  }
}

function runValidation(root, context) {
  return spawnSync(
    process.execPath,
    [path.join(projectRoot, 'scripts/validate-site.mjs'), `--validation-context=${context}`],
    { cwd: root, encoding: 'utf8' }
  );
}

function withFixture(files, callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'a7-validation-context-'));
  try {
    for (const relativePath of files) {
      const absolutePath = path.join(root, relativePath);
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, 'fixture');
    }
    callback(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('complete repository context selects strict validation and has all private sources', () => {
  withFixture(REPOSITORY_PRIVATE_SOURCES, (root) => {
    assert.equal(resolveValidationContext(['--validation-context=repository']), 'repository');
    assert.deepEqual(findMissingRepositoryPrivateSources(root), []);
  });
});

test('repository context reports a missing Lovart production brief', () => {
  const files = REPOSITORY_PRIVATE_SOURCES.filter((file) => !file.endsWith('LOVART-HERO-PROMPT.md'));
  withFixture(files, (root) => {
    assert.deepEqual(
      findMissingRepositoryPrivateSources(root),
      ['marketing/google-ads/2026-07-guest-laundry-search/LOVART-HERO-PROMPT.md']
    );
    assert.deepEqual(
      repositoryPrivateValidationFailures(root),
      ['Guest Laundry landing: Lovart hero production brief is missing']
    );
  });
});

test('repository context reports a missing Lovart master image', () => {
  const files = REPOSITORY_PRIVATE_SOURCES.filter(
    (file) => !file.endsWith('A7_GUEST_LAUNDRY_HERO_LOVART_MASTER.png')
  );
  withFixture(files, (root) => {
    assert.deepEqual(
      findMissingRepositoryPrivateSources(root),
      ['marketing/google-ads/2026-07-guest-laundry-search/assets/hero/A7_GUEST_LAUNDRY_HERO_LOVART_MASTER.png']
    );
    assert.deepEqual(
      repositoryPrivateValidationFailures(root),
      ['Guest Laundry landing: Lovart hero master is missing from the campaign archive']
    );
  });
});

test('public context is valid when repository-private paths are absent', () => {
  withFixture([], (root) => {
    assert.equal(resolveValidationContext(['--validation-context=public']), 'public');
    assert.equal(findMissingRepositoryPrivateSources(root).length, REPOSITORY_PRIVATE_SOURCES.length);
  });
});

test('public context is valid with a partial internal campaign directory', () => {
  const partialPath = 'marketing/google-ads/2026-07-guest-laundry-search/partial-placeholder.txt';
  withFixture([partialPath], (root) => {
    assert.equal(resolveValidationContext(['--validation-context=public']), 'public');
    assert.equal(findMissingRepositoryPrivateSources(root).length, REPOSITORY_PRIVATE_SOURCES.length);
  });
});

test('public validator keeps all public checks active without repository-private sources', () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'a7-public-validator-'));

  try {
    copyPublicValidatorSourceSet(fixtureRoot);
    const runPublicValidation = () => runValidation(fixtureRoot, 'public');

    const absentInternals = runPublicValidation();
    assert.equal(absentInternals.status, 0, absentInternals.stderr);
    assert.match(absentInternals.stdout, /Validation context: public/);
    assert.match(absentInternals.stdout, /Repository-private validation: not applicable/);

    fs.mkdirSync(
      path.join(fixtureRoot, 'marketing/google-ads/2026-07-guest-laundry-search'),
      { recursive: true }
    );
    const partialInternals = runPublicValidation();
    assert.equal(partialInternals.status, 0, partialInternals.stderr);
    assert.match(partialInternals.stdout, /Static site validation passed/);

    fs.rmSync(path.join(fixtureRoot, 'public/orlando-guest-laundry-handoff-v1.webp'));
    const missingPublicHero = runPublicValidation();
    assert.notEqual(missingPublicHero.status, 0);
    assert.match(
      missingPublicHero.stderr,
      /Guest Laundry landing: optimized image is missing: public\/orlando-guest-laundry-handoff-v1\.webp/
    );
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test('repository validator fails when either required Lovart source is absent', () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'a7-repository-validator-'));
  const brief = 'marketing/google-ads/2026-07-guest-laundry-search/LOVART-HERO-PROMPT.md';
  const master = 'marketing/google-ads/2026-07-guest-laundry-search/assets/hero/A7_GUEST_LAUNDRY_HERO_LOVART_MASTER.png';

  try {
    copyPublicValidatorSourceSet(fixtureRoot);
    copyRepositoryPrivateSources(fixtureRoot);

    const completeRepository = runValidation(fixtureRoot, 'repository');
    assert.equal(completeRepository.status, 0, completeRepository.stderr);

    fs.rmSync(path.join(fixtureRoot, brief));
    const missingBrief = runValidation(fixtureRoot, 'repository');
    assert.notEqual(missingBrief.status, 0);
    assert.match(missingBrief.stderr, /Lovart hero production brief is missing/);

    fs.copyFileSync(path.join(projectRoot, brief), path.join(fixtureRoot, brief));
    fs.rmSync(path.join(fixtureRoot, master));
    const missingMaster = runValidation(fixtureRoot, 'repository');
    assert.notEqual(missingMaster.status, 0);
    assert.match(missingMaster.stderr, /Lovart hero master is missing from the campaign archive/);
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test('missing, invalid and contradictory contexts fail closed', () => {
  assert.throws(() => resolveValidationContext([]), /Validation context is required/);
  assert.throws(
    () => resolveValidationContext(['--validation-context=preview']),
    /Unsupported validation context/
  );
  assert.throws(
    () => resolveValidationContext([
      '--validation-context=repository',
      '--validation-context=public'
    ]),
    /Contradictory validation context arguments/
  );
});
