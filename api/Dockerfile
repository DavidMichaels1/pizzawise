# Runs directly with Node's built-in TypeScript type-stripping (Node 22+),
# so there's no compile stage — just install, generate the Prisma client,
# and run. Migrations run automatically on container start via
# `prisma migrate deploy`, which is why prisma is a runtime dependency
# rather than a devDependency here.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
RUN npx prisma generate

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma
COPY src ./src
USER app
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node --experimental-strip-types src/index.ts"]
