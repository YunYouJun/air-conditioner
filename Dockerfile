FROM node:12

WORKDIR /app
COPY . .
RUN yarn install && yarn build

FROM nginx:latest

ENV AC_NGINX_PORT=80 AC_NGINX_DOMAIN=localhost
COPY --from=0 /app/config/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=0 /app/build /usr/share/nginx/html
