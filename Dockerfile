# Deno runtime for Trekkopoly game server
FROM denoland/deno:alpine-2.2.0

WORKDIR /app

# Copy only what the server needs
COPY server/ ./server/
COPY src/shared/ ./src/shared/

# The data directory for auth users.json
RUN mkdir -p /app/server/data

# Expose the server port
EXPOSE 8080

# Run the server with all needed permissions
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "--no-check", "server/server.ts"]
