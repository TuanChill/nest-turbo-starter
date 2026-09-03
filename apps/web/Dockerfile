# syntax=docker/dockerfile:1
# Multi-stage build for the Next.js web app. Build with:
#   docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=... .
# Uses `turbo prune` for a consistent build story with the NestJS services,
# and Next's `output: 'standalone'` for a minimal runtime layer. BuildKit
# cache mounts persist the pnpm store and Next's own incremental build cache
# across builds, so repeat builds after the first are fast.

FROM node:22.15.0-alpine3.21 AS base
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate
RUN pnpm config set store-dir /pnpm-store

FROM base AS pruner
WORKDIR /work
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm dlx turbo prune web --docker

FROM base AS installer
WORKDIR /work
COPY --from=pruner /work/out/json/ .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm install --frozen-lockfile
COPY --from=pruner /work/out/full/ .

# Next.js inlines NEXT_PUBLIC_* vars at build time, so they must be the
# browser-reachable gateway URL, not a Docker-internal service name.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
RUN --mount=type=cache,id=next-cache,target=/work/apps/web/.next/cache \
    pnpm exec turbo run build --filter=web

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /work
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=installer --chown=nextjs:nodejs /work/apps/web/public ./apps/web/public
COPY --from=installer --chown=nextjs:nodejs /work/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /work/apps/web/.next/static ./apps/web/.next/static
USER nextjs
EXPOSE 3001
ENV PORT=3001
CMD ["node", "apps/web/server.js"]
