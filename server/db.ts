import postgres from "npm:postgres";
import type { Room } from "./game.ts";

const databaseUrl = Deno.env.get("DATABASE_URL") || "postgres://postgres:Vth281206%40@180.93.43.231:5432/trekkopoly_db";

export const sql = postgres(databaseUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export async function initDb() {
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
    
    // We don't use strict FOREIGN KEY for winner_id and user_id because guests have random UUIDs
    await sql`
      CREATE TABLE IF NOT EXISTS matches (
        id UUID PRIMARY KEY,
        room_id VARCHAR(50) NOT NULL,
        max_days INT NOT NULL,
        max_players INT NOT NULL,
        winner_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS match_players (
        match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
        user_id UUID,
        name VARCHAR(255) NOT NULL,
        vp INT NOT NULL,
        xu INT NOT NULL,
        stamina INT NOT NULL,
        debt_token INT NOT NULL,
        PRIMARY KEY (match_id, name)
      );
    `;

    console.log("[db] PostgreSQL tables initialized successfully.");
  } catch (err) {
    console.error("[db] Failed to initialize PostgreSQL tables:", err);
  }
}

export async function saveMatchResult(room: Room) {
  try {
    const matchId = crypto.randomUUID();
    
    // Insert match
    await sql`
      INSERT INTO matches (id, room_id, max_days, max_players, winner_id)
      VALUES (${matchId}, ${room.roomId}, ${room.maxDays}, ${room.maxPlayers}, ${room.winnerId ?? null})
    `;

    // Insert all players
    for (const p of room.players) {
      await sql`
        INSERT INTO match_players (match_id, user_id, name, vp, xu, stamina, debt_token)
        VALUES (
          ${matchId}, 
          ${p.playerId}, 
          ${p.name}, 
          ${p.resources.vp}, 
          ${p.resources.xu}, 
          ${p.resources.stamina}, 
          ${p.resources.debtToken}
        )
      `;
    }
    
    console.log(`[db] Match result for room ${room.roomId} saved successfully.`);
  } catch (err) {
    console.error(`[db] Failed to save match result for room ${room.roomId}:`, err);
  }
}

export async function getUserHistory(userId: string) {
  try {
    return await sql`
      SELECT 
        m.id as match_id,
        m.room_id,
        m.max_days,
        m.created_at,
        mp.vp,
        mp.xu,
        mp.stamina,
        (m.winner_id = mp.user_id) as is_winner
      FROM matches m
      JOIN match_players mp ON m.id = mp.match_id
      WHERE mp.user_id = ${userId}
      ORDER BY m.created_at DESC
      LIMIT 50
    `;
  } catch (err) {
    console.error(`[db] Failed to fetch history for user ${userId}:`, err);
    return [];
  }
}
