import fs from 'node:fs';
import path from 'node:path';
import { recordSha256, stableJson, validateReleaseLedger } from '../../mos-app/release-ledger-contract.js';

export const RELEASE_LEDGER_DIR = 'mos-data/release-observations';
export const GENERATED_LEDGER_PATH = 'mos-app/generated/release-ledger.json';

export function loadReleaseRecords(root = process.cwd()) {
  const directory = path.join(root, RELEASE_LEDGER_DIR);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((name) => name.endsWith('.json')).sort().map((name) => {
    const record = JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
    if (`${record.observationId}.json` !== name) throw new Error(`release ledger filename mismatch: ${name}`);
    return record;
  });
}

export function compileReleaseLedger(root = process.cwd()) {
  const records = loadReleaseRecords(root);
  const tip = records.at(-1) || null;
  return validateReleaseLedger({
    schemaVersion: '1.0', records,
    ledgerTipObservationId: tip?.observationId || null,
    ledgerTipSha256: tip ? recordSha256(tip) : null
  });
}

export function writeCompiledReleaseLedger(root = process.cwd()) {
  const ledger = compileReleaseLedger(root);
  const destination = path.join(root, GENERATED_LEDGER_PATH);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, stableJson(ledger));
  return { ledger, destination };
}

export function appendReleaseRecord(record, root = process.cwd()) {
  const records = loadReleaseRecords(root);
  const previous = records.at(-1) || null;
  const candidate = {
    ...record,
    previousObservationId: previous?.observationId || null,
    previousRecordSha256: previous ? recordSha256(previous) : null
  };
  const tip = candidate;
  validateReleaseLedger({ schemaVersion: '1.0', records: [...records, candidate], ledgerTipObservationId: tip.observationId, ledgerTipSha256: recordSha256(tip) });
  const directory = path.join(root, RELEASE_LEDGER_DIR);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, `${candidate.observationId}.json`), stableJson(candidate), { flag: 'wx' });
  writeCompiledReleaseLedger(root);
  return candidate;
}
