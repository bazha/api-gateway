FROM node:20.9.0-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm i
COPY . .
RUN npm run build
EXPOSE 3000