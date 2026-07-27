#!/bin/sh
# The verification gate from CLAUDE.md, as one command so a pull request check and
# a human run the same thing. There are no tests: this catches the two failure
# modes that are silent in a single-file, no-build app — a syntax error in either
# script block, and an inline handler that no longer exists on `window`.
#
# Deliberately no npm. python3 and node are the only requirements.
set -e
cd "$(dirname "$0")/.."

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

python3 -c "
import re, sys
html = open('index.html').read()
module = re.findall(r'<script type=\"module\">(.*?)</script>', html, re.S)
plain = re.findall(r'<script>(.*?)</script>', html, re.S)
if not module or not plain:
    sys.exit('could not find both script blocks in index.html')
open('$tmp/module.mjs', 'w').write(module[0])
open('$tmp/plain.js', 'w').write(plain[-1])
"
node --check "$tmp/module.mjs"
node --check "$tmp/plain.js"
echo "ok: both script blocks parse"

python3 -c "
import re, sys
html = open('index.html').read()
calls = set()
for attribute in ['onclick', 'onsubmit', 'oninput', 'onchange', 'onfocus', 'onblur']:
    calls |= set(re.findall(attribute + r'=\"([a-zA-Z_\$][\w\$]*)\(', html))
plain = re.findall(r'<script>(.*?)</script>', html, re.S)[-1]
exposed = set(re.findall(r'window\.([\w\$]+)\s*=', plain))
missing = sorted(calls - exposed - {'this'})
if missing:
    sys.exit('inline handlers missing from window: ' + ', '.join(missing))
print('ok: all', len(calls), 'inline handlers exist on window')
"

# The loop's own guardrails: skill frontmatter, and that this repo can never be
# pointed at another loop's Linear team or GitHub repository.
node scripts/validate.mjs
echo "ok: loop configuration valid"

cat <<'REMINDER'

Reminder: these checks do not see layout. Before calling a UI change done, open
it in a browser and look at it — a white button face and a dead column were both
invisible here until someone took a screenshot.
REMINDER
