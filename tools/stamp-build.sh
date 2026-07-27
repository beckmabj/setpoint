#!/bin/sh
# Stamps the build number into index.html as the count of commits including
# the one being created. Runs as a pre-commit hook so the number in the app
# always matches the commit that shipped it — there is no build step to hang
# this on, and a manually bumped constant would drift the first time it was
# forgotten.
set -e
next=$(( $(git rev-list --count HEAD 2>/dev/null || echo 0) + 1 ))
if grep -q "^const BUILD = [0-9]*;" index.html; then
  # BSD sed (macOS) needs the empty -i argument
  sed -i '' "s/^const BUILD = [0-9]*;/const BUILD = ${next};/" index.html
  git add index.html
  echo "stamped build ${next}"
fi
