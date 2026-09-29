# Vite bakes VITE_* env vars into the built JS at build time, not runtime —
# so the API's URL must be supplied as a build ARG here, not a container
# env var later. On Railway this is wired to the api service's public
# domain via a variable reference (see README).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
