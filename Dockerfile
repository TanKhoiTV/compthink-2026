FROM node:22-alpine

WORKDIR /app

COPY server/ ./server/
COPY src/data/ ./src/data/
COPY src/types.ts ./src/types.ts

RUN cd server && npm install --omit=dev

EXPOSE 7860

CMD ["npx", "tsx", "server/index.ts"]
