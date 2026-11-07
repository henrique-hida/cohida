FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN CYPRESS_INSTALL_BINARY=0 npm ci && npm cache clean --force

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
