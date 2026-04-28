# syntax=docker/dockerfile:1.6

FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./
RUN --mount=type=cache,target=/root/.npm npm install

COPY . .

ARG SHOPRO_VERSION=v2.4.1
ARG SHOPRO_BASE_URL=
ARG SHOPRO_DEV_BASE_URL=
ARG SHOPRO_UPLOAD_TYPE=server
ARG SHOPRO_API_PATH=/app-api
ARG SHOPRO_WEBSOCKET_PATH=/infra/ws
ARG SHOPRO_DEV_PORT=3000
ARG SHOPRO_STATIC_URL=
ARG SHOPRO_H5_URL=http://localhost:3000
ARG SHOPRO_MPLIVE_ON=0
ARG SHOPRO_TENANT_ID=1

RUN printf '%s\n' \
    "SHOPRO_VERSION=${SHOPRO_VERSION}" \
    "SHOPRO_BASE_URL=${SHOPRO_BASE_URL}" \
    "SHOPRO_DEV_BASE_URL=${SHOPRO_DEV_BASE_URL}" \
    "SHOPRO_UPLOAD_TYPE=${SHOPRO_UPLOAD_TYPE}" \
    "SHOPRO_API_PATH=${SHOPRO_API_PATH}" \
    "SHOPRO_WEBSOCKET_PATH=${SHOPRO_WEBSOCKET_PATH}" \
    "SHOPRO_DEV_PORT=${SHOPRO_DEV_PORT}" \
    "SHOPRO_STATIC_URL=${SHOPRO_STATIC_URL}" \
    "SHOPRO_H5_URL=${SHOPRO_H5_URL}" \
    "SHOPRO_MPLIVE_ON=${SHOPRO_MPLIVE_ON}" \
    "SHOPRO_TENANT_ID=${SHOPRO_TENANT_ID}" \
    > .env.production.local \
    && npm run build:h5

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/build/h5 /usr/share/nginx/html

EXPOSE 80
