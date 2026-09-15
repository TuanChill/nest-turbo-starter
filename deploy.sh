#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/opt/circle/be"
COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)
DEPLOY_REF="${1:-origin/main}"

cd "$APP_DIR"

exec 9>/run/lock/circle-be-deploy.lock
flock -n 9 || {
  echo "Another backend deployment is already running." >&2
  exit 1
}

if [[ ! -f .env ]]; then
  echo "Missing $APP_DIR/.env; refusing to deploy without production configuration." >&2
  exit 1
fi

echo "Fetching the requested revision..."
git fetch --prune origin main
git rev-parse --verify "${DEPLOY_REF}^{commit}" >/dev/null
git reset --hard "$DEPLOY_REF"
echo "Deploying revision $(git rev-parse --short HEAD)..."

if [[ ! -f docker-compose.prod.yml ]]; then
  echo "Missing docker-compose.prod.yml after checkout." >&2
  exit 1
fi

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
# The production host currently runs Docker 20.10 without buildx. Serializing
# Compose builds avoids the daemon's concurrent BuildKit connection deadlock.
export COMPOSE_PARALLEL_LIMIT=1

echo "Validating Compose configuration..."
"${COMPOSE[@]}" config >/dev/null

echo "Starting stateful dependencies..."
"${COMPOSE[@]}" up -d db redis etcd

echo "Waiting for PostgreSQL..."
for attempt in {1..60}; do
  if "${COMPOSE[@]}" exec -T db pg_isready >/dev/null 2>&1; then
    break
  fi
  if [[ "$attempt" == 60 ]]; then
    echo "PostgreSQL did not become ready in time." >&2
    "${COMPOSE[@]}" logs --tail=80 db >&2 || true
    exit 1
  fi
  sleep 2
done

echo "Reclaiming unused Docker build cache and images..."
# Keep running containers and all named volumes (including PostgreSQL data),
# while preventing repeated image builds from exhausting the host disk.
docker builder prune -af --filter until=168h
docker image prune -af --filter until=168h

changed_files="$(git diff --name-only "${DEPLOY_REF}^" "${DEPLOY_REF}" || true)"
build_targets=()
build_all=false

add_build_target() {
  local target="$1"
  local existing
  for existing in "${build_targets[@]}"; do
    [[ "$existing" == "$target" ]] && return
  done
  build_targets+=("$target")
}

while IFS= read -r changed_file; do
  case "$changed_file" in
    apps/auth-service/*) add_build_target auth-service ;;
    apps/user-service/*) add_build_target user-service ;;
    apps/notification-service/*) add_build_target notification-service ;;
    apps/project-service/*) add_build_target project-service ;;
    apps/web/*|deploy.sh) add_build_target web ;;
    .docker/compose/nodejs/*|libs/common/*|libs/core/*|package.json|pnpm-lock.yaml|pnpm-workspace.yaml|turbo.json)
      build_all=true
      ;;
    .docker/compose/apisix/*|docker-compose.yml|docker-compose.prod.yml)
      add_build_target apisix
      add_build_target adc
      ;;
  esac
done <<< "$changed_files"

if [[ "$build_all" == true ]]; then
  build_targets=(auth-service user-service notification-service project-service web apisix adc)
fi

if [[ "${#build_targets[@]}" -gt 0 ]]; then
  echo "Building backend images: ${build_targets[*]}"
  "${COMPOSE[@]}" build "${build_targets[@]}"
else
  echo "No backend image changes detected; reusing existing images."
fi

echo "Applying database migrations..."
"${COMPOSE[@]}" run --rm --no-deps -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 project-service pnpm --filter=project-service migration:up

echo "Starting backend services and API gateway..."
"${COMPOSE[@]}" up -d --remove-orphans auth-service user-service notification-service project-service web apisix apisix-homepage

apisix_profile="$(awk -F= '$1 == "APISIX_PROFILE" { value=$2 } END { print value }' .env)"
apisix_profile="${apisix_profile:-dev}"

echo "Synchronizing API gateway routes..."
for attempt in {1..30}; do
  if "${COMPOSE[@]}" run --rm --no-deps adc adc sync -f "conf/apisix-${apisix_profile}.yaml"; then
    break
  fi
  if [[ "$attempt" == 30 ]]; then
    echo "API gateway configuration did not become ready in time." >&2
    "${COMPOSE[@]}" logs --tail=80 apisix >&2 || true
    exit 1
  fi
  sleep 2
done

apisix_port="$(awk -F= '$1 == "APISIX_NODE_LISTEN" { value=$2 } END { print value }' .env)"
apisix_port="${apisix_port:-9080}"

echo "Running backend smoke check..."
for attempt in {1..30}; do
  if curl --fail --silent --show-error --max-time 5 "http://127.0.0.1:${apisix_port}/circle/api/health" >/dev/null; then
    echo "Backend is healthy on port ${apisix_port}."
    "${COMPOSE[@]}" ps
    exit 0
  fi
  sleep 2
done

echo "Backend smoke check failed." >&2
"${COMPOSE[@]}" ps >&2 || true
"${COMPOSE[@]}" logs --tail=100 auth-service user-service notification-service project-service apisix >&2 || true
exit 1
