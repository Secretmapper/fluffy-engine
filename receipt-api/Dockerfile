FROM node:lts-alpine

WORKDIR /usr/src/app
COPY package*.json ./
COPY environment.d.ts ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
RUN npm install
COPY ./src ./src
RUN npm run build
CMD npm start
