FROM node:12

WORKDIR /app
COPY . .
RUN yarn install && yarn build

FROM nginx:latest

COPY --from=0 /app/build /usr/share/nginx/html
