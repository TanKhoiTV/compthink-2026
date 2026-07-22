import postgres from "postgres";
import type { RoomState, PlayerPrivateState } from "./types.js";

/**
 * Lớp database (PostgreSQL) cho server LIVE (TREKPOLOGY/server).
 *
 * Credential CHỈ đọc từ env DATABASE_URL — không bao giờ hardcode trong source.
 * Nếu chưa cấu hình, server vẫn chạy bình thường ở chế độ "không DB":
 * tài khoản & lịch sử sẽ không lưu, nhưng game (matchmaking, bot…) vẫn hoạt động.
 */
const databaseUrl = process.env.DATABASE_URL;

export const sql = databaseUrl
  ? postgres(databaseUrl, { max: 10, idle_timeout: 20, connect_timeout: 10 })
  : null;

if (!sql) {
  console.warn(
    "[db] DATABASE_URL chưa set — chạy chế độ KHÔNG DB (tài khoản & lịch sử không được lưu).",
  );
}

/** Tạo bảng nếu chưa có. Gọi 1 lần lúc server khởi động. */
export async function initDb() {
  if (!sql) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Không dùng FOREIGN KEY cứng cho winner_id / user_id vì khách (guest) chưa có tài khoản.
    await sql`
      CREATE TABLE IF NOT EXISTS matches (
        id UUID PRIMARY KEY,
        room_id VARCHAR(50) NOT NULL,
        max_days INT NOT NULL,
        max_players INT NOT NULL,
        winner_name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS match_players (
        match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
        user_id UUID,
        name VARCHAR(255) NOT NULL,
        is_bot BOOLEAN NOT NULL DEFAULT FALSE,
        vp INT NOT NULL,
        xu INT NOT NULL,
        stamina INT NOT NULL,
        debt_token INT NOT NULL,
        PRIMARY KEY (match_id, name)
      );
    `;

    console.log("[db] PostgreSQL: bảng đã sẵn sàng.");
  } catch (err) {
    console.error("[db] Khởi tạo bảng thất bại:", err);
  }
}

/** Lưu kết quả 1 ván khi vào phase gameover. An toàn no-op nếu chưa cấu hình DB. */
export async function saveMatchResult(state: RoomState) {
  if (!sql) return;
  try {
    const players: PlayerPrivateState[] = Object.values(state.players).filter(
      (p): p is PlayerPrivateState => !!p && p.hasJoined,
    );
    if (players.length === 0) return;

    const winner = players.reduce((best, p) => (p.score > best.score ? p : best), players[0]);

    const matchId = crypto.randomUUID();

    await sql`
      INSERT INTO matches (id, room_id, max_days, max_players, winner_name)
      VALUES (${matchId}, ${state.roomId}, ${5}, ${players.length}, ${winner.name})
    `;

    for (const p of players) {
      await sql`
        INSERT INTO match_players (match_id, user_id, name, is_bot, vp, xu, stamina, debt_token)
        VALUES (
          ${matchId},
          ${null},
          ${p.name},
          ${p.isBot === true},
          ${p.score},
          ${p.coin},
          ${p.stamina},
          ${p.coinDebt ?? 0}
        )
      `;
    }

    console.log(`[db] Đã lưu kết quả ván phòng ${state.roomId} (thắng: ${winner.name}).`);
  } catch (err) {
    console.error(`[db] Lưu kết quả ván ${state.roomId} thất bại:`, err);
  }
}

/** Lịch sử các ván theo tên người chơi (tạm thời, chưa gắn user_id tài khoản). */
export async function getMatchHistoryByName(name: string) {
  if (!sql) return [];
  try {
    return await sql`
      SELECT m.id AS match_id, m.room_id, m.max_days, m.created_at,
             mp.vp, mp.xu, mp.stamina, (m.winner_name = mp.name) AS is_winner
      FROM matches m
      JOIN match_players mp ON m.id = mp.match_id
      WHERE mp.name = ${name}
      ORDER BY m.created_at DESC
      LIMIT 50
    `;
  } catch (err) {
    console.error(`[db] Lấy lịch sử cho ${name} thất bại:`, err);
    return [];
  }
}

// --- API tài khoản (auth.ts dùng) ---

export type DbUserRow = {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
};

export async function dbFindUserByUsername(username: string): Promise<DbUserRow | null> {
  if (!sql) throw new Error("DB chưa được cấu hình (DATABASE_URL).");
  const rows = await sql<DbUserRow[]>`
    SELECT id, username, display_name, password_hash FROM users WHERE username = ${username} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function dbInsertUser(row: DbUserRow): Promise<void> {
  if (!sql) throw new Error("DB chưa được cấu hình (DATABASE_URL).");
  await sql`
    INSERT INTO users (id, username, display_name, password_hash)
    VALUES (${row.id}, ${row.username}, ${row.display_name}, ${row.password_hash})
  `;
}
