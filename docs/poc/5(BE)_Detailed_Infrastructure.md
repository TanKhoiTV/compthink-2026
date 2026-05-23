
## 1. Hạ Tầng Chi Tiết

### 1.1 Bản Đồ Module & Trách Nhiệm

```mermaid
graph TD
    subgraph BuildPipeline
        TSC["tsc"] --> BUILD[".build/"]
        LESSC["lessc"] --> CSS["client.css"]
        ROLLUP["rollup"] --> JS["client.js"]
        SW["sw.js"] --> PWA["PWA"]
    end

    BUILD -->|Da bien dich| CLIENT_BROWSER

    subgraph CLIENT_BROWSER
        INDEX["index.html"] --> CLIENTJS["client.js"]
        CLIENTJS --> APP["app.ts"]
        CLIENTJS --> MULTI["multi.ts"]
        CSS_CLIENT["client.css"]
        IMG["img/"]
    end

    MULTI -->|WebSocket| SERVER_DENO
    SERVER_DENO -->|WebSocket| MULTI

    subgraph SERVER_DENO
        SERVER["server.ts"] --> PLAYER["player.ts"]
        SERVER --> GAME["game.ts"]
        PLAYER --> GAME
        DOCKER["Dockerfile"]
    end

    SERVER_DENO -->|Imports| LOGIC_CHUNG

    subgraph LOGIC_CHUNG
        BOARD["board.ts"]
        RULES["rules.ts"]
        SCORE["score.ts"]
        DICE["dice.ts"]
    end
```

#### Backend Module — Chi Tiết

| Module | Sở hữu | KHÔNG sở hữu |
|---|---|---|
| `server.ts` | HTTP listener, WS handshake, room registry `Map<roomId, Room>` | Business logic, trạng thái người chơi, tính điểm |
| `game.ts` |Room FSM, bộ đếm thời gian pha, vòng lặp broadcast, bộ đếm ngày | Tài nguyên người chơi riêng lẻ, thay đổi lưới, tính toán VP |
| `player.ts` | Gửi RPC theo socket, trạng thái Xu/Stamina/Debt, bitmask khóa stamina | Sự kiện cấp phòng, trạng thái lưới, tính điểm |



