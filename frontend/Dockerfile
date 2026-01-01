FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 👇 REQUIRED FOR VITE
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

EXPOSE 3000

# 👇 REQUIRED FOR DOCKER
CMD ["npm", "run", "dev", "--", "--host"]
