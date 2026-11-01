#!/bin/sh
# Regenerate src/api/schema.d.ts from the spend-manager-service OpenAPI spec.
#
#   npm run generate:api                                   # from the running service
#   npm run generate:api -- --from-service ../spend-manager-service
#                                                          # from the service code, no server
#
# SPEND_MANAGER_API_URL overrides the service address (default http://127.0.0.1:8000).
set -eu

cd "$(dirname "$0")/.."
out=src/api/schema.d.ts

if [ "${1:-}" = "--from-service" ]; then
  service_dir=${2:?usage: generate-api.sh --from-service <spend-manager-service folder>}
  spec="$(pwd)/openapi.json"
  (cd "$service_dir" && uv run --quiet python -c \
    "import json, sys; from spend_manager.main import app; json.dump(app.openapi(), sys.stdout, indent=2)") >"$spec"
  npx openapi-typescript "$spec" -o "$out"
  rm -f "$spec"
else
  npx openapi-typescript "${SPEND_MANAGER_API_URL:-http://127.0.0.1:8000}/openapi.json" -o "$out"
fi
