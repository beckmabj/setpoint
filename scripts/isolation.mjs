// This loop must never claim work belonging to another loop. A shared Linear team
// makes issue assignment a race; a shared repository makes the PR queue a race.
export function findConflicts(config, actualRepository) {
  const conflicts = [];
  for (const other of config?.conflictsWith ?? []) {
    if (config.linearTeamKey === other.linearTeamKey) {
      conflicts.push(`Linear team ${other.linearTeamKey} already belongs to ${other.loop}; use a separate team`);
    }
    if (config.githubRepository === other.githubRepository) {
      conflicts.push(
        `GitHub repository ${other.githubRepository} already belongs to ${other.loop}; use a separate repository`,
      );
    }
  }
  // A wrong `origin` would send this loop's pull requests to somebody else's repo.
  if (actualRepository && config?.githubRepository && actualRepository !== config.githubRepository) {
    conflicts.push(`origin is ${actualRepository} but .linear-loop.json declares ${config.githubRepository}`);
  }
  return conflicts;
}
