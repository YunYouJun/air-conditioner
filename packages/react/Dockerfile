FROM node:lts-alpine AS builder

WORKDIR /app
# Node.js no longer ships Corepack (removed in v25). Install the pnpm
# version pinned by package.json so the image build does not depend on it.
COPY package.json ./
RUN npm install -g "pnpm@$(node -p 'require("./package.json").packageManager.split("@")[1]')"

COPY . .

RUN pnpm install --frozen-lockfile && pnpm run react:build

FROM nginx:alpine

ENV AC_NGINX_PORT=80 AC_NGINX_DOMAIN=localhost
COPY --from=builder /app/packages/react/dist /usr/share/nginx/html
EXPOSE 80
