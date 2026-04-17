FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_BACKEND_URL
ARG VITE_CURRENCY=INR

ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_CURRENCY=${VITE_CURRENCY}

COPY admin/package*.json ./admin/
RUN npm ci --prefix ./admin

COPY admin ./admin
COPY shared ./shared

RUN npm run build --prefix ./admin

FROM nginx:1.27-alpine

COPY admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/admin/dist /usr/share/nginx/html

EXPOSE 80
