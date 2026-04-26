FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
EXPOSE 4300
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--port", "4300", "--poll", "2000"]
