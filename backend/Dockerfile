FROM node:18-alpine

WORKDIR /app

# Install PostgreSQL client for migrations
RUN apk add --no-cache postgresql-client bash curl

COPY package*.json ./
RUN npm install

COPY . .

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 5000

CMD ["sh", "/app/entrypoint.sh"]
