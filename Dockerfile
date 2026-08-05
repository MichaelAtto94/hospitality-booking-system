FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl curl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN npx prisma generate && npm run build
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD curl -f http://localhost:3000/api/health || exit 1
CMD ["sh","-c","npx prisma migrate deploy && npm start"]
