import { spawnSync } from 'child_process';
const buildHashCmd = spawnSync(
  'git',
  'describe --always --dirty --tags'.split(' '),
);
export const BUILD_COMMIT = buildHashCmd.stdout.toString().trim();
