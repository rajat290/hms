FROM node:20-alpine

WORKDIR /app/backend

ENV NODE_ENV=production

COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY backend ./

EXPOSE 4000

CMD ["npm", "start"]
