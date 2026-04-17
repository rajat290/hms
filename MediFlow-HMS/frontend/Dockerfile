FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_BACKEND_URL
ARG VITE_CURRENCY=INR
ARG VITE_RAZORPAY_KEY_ID=

ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_CURRENCY=${VITE_CURRENCY}
ENV VITE_RAZORPAY_KEY_ID=${VITE_RAZORPAY_KEY_ID}

COPY frontend/package*.json ./frontend/
RUN npm ci --prefix ./frontend

COPY frontend ./frontend
COPY shared ./shared

RUN npm run build --prefix ./frontend

FROM nginx:1.27-alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
