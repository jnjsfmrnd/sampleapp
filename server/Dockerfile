# Backend Dockerfile
FROM node:20
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 4000
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
