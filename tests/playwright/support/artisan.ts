/**
 * Docker-exec / artisan shim.
 *
 * Shells out either inside the docker app container or directly on the host,
 * matching tests/cypress/support/helpers/app.js so the same env-var contract
 * works across both harnesses.
 *
 * Env vars (mirror cypress's CYPRESS_USE_DOCKER / _CONTAINER / _USER):
 *
 *   PW_USE_DOCKER       "false" / "0" / "no" skips docker exec (default:
 *                       docker, matching the dev compose stack the smoke
 *                       walkthrough targets).
 *   PW_DOCKER_CONTAINER docker container name. Default "monica-app-1"
 *                       (docker-compose.dev.yml service name pluralised).
 *   PW_DOCKER_USER      --user passed to docker exec. Default "www-data";
 *                       set to empty string to run as root (which chowns
 *                       storage/logs/laravel.log to root and 500s every
 *                       subsequent authenticated request — see #592).
 *
 * Returns the command's stdout. Errors throw (execFileSync raises on
 * non-zero exit).
 */

import { execFileSync } from 'node:child_process';

const USE_DOCKER = process.env.PW_USE_DOCKER === undefined
  ? true
  : !/^(false|0|no)$/i.test(process.env.PW_USE_DOCKER);
const DOCKER_CONTAINER = process.env.PW_DOCKER_CONTAINER ?? 'monica-app-1';
const DOCKER_USER = process.env.PW_DOCKER_USER === undefined ? 'www-data' : process.env.PW_DOCKER_USER;

/**
 * Runs an arbitrary command, prefixed with `docker exec --user <user>
 * <container>` when PW_USE_DOCKER is on.
 */
export function dockerExec(...args: string[]): string {
  const cmd = USE_DOCKER
    ? [
        'docker', 'exec',
        ...(DOCKER_USER ? ['--user', DOCKER_USER] : []),
        DOCKER_CONTAINER,
        ...args,
      ]
    : args;
  return execFileSync(cmd[0], cmd.slice(1), { encoding: 'utf8' });
}

/**
 * Convenience wrapper for `php artisan <args>`.
 */
export function artisan(...args: string[]): string {
  return dockerExec('php', 'artisan', ...args);
}

export function artisanTargetsDocker(): boolean {
  return USE_DOCKER;
}
