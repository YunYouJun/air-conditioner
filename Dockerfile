FROM node:lts-alpine as builder

RUN npm install -g pnpm

WORKDIR /app
COPY . .

RUN pnpm install && npm run build

FROM nginx:alpine

ENV AC_NGINX_PORT=80 AC_NGINX_DOMAIN=localhost
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
