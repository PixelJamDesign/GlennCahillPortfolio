#!/bin/bash
# Puts glenncahill.com live from this folder on the Pi. SiteInsight runs it
# after you approve a Claude Code fix; you can run it yourself too.
# It builds the site, and only if the build works copies dist/ into
# /var/www/glenncahill.com, which Caddy serves (the same as `npm run deploy`).
set -euo pipefail
cd "$(dirname "$0")"
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

echo "Building glenncahill.com…"
npm run deploy
echo "Done. glenncahill.com is live with this folder's version."
