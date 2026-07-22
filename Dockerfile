# Node.js runtime for Trekkopoly game server
FROM node:22-alpine

WORKDIR /app

# Copy server source and shared dependencies
COPY server/ ./server/
COPY src/ ./src/

# Install production dependencies only
RUN cd server && npm install --omit=dev

# HF Space listens on port 7860
ENV PORT=7860
EXPOSE 7860

CMD ["npx", "tsx", "server/index.ts"]