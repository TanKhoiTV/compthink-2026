import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
};

type StoredUser = AuthUser & {
  passwordHash: string;
  createdAt: string;
};

type UsersDatabase = {
  users: StoredUser[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const PASSWORD_ITERATIONS = 120_000;
const AUTH_SECRET = process.env.AUTH_SECRET ??
  "dev-secret-change-me-before-deploying-online";

function ensureUsersFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(
      USERS_FILE,
      JSON.stringify({ users: [] }, null, 2),
      "utf-8",
    );
  }
}

function readUsersDatabase(): UsersDatabase {
  ensureUsersFile();

  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8")) as UsersDatabase;
  } catch {
    return { users: [] };
  }
}

function writeUsersDatabase(database: UsersDatabase) {
  ensureUsersFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(database, null, 2), "utf-8");
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function toPublicUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  };
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, 32, "sha256")
    .toString("hex");

  return `${PASSWORD_ITERATIONS}:${salt}:${hash}`;
}

function verifyPassword(password: string, passwordHash: string) {
  const [iterationsText, salt, expectedHash] = passwordHash.split(":");
  const iterations = Number(iterationsText);

  if (!iterations || !salt || !expectedHash) return false;

  const actualHash = crypto
    .pbkdf2Sync(password, salt, iterations, 32, "sha256")
    .toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(actualHash, "hex"),
    Buffer.from(expectedHash, "hex"),
  );
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  return Buffer.from(padded, "base64").toString("utf-8");
}

function signTokenPayload(encodedHeader: string, encodedPayload: string) {
  return base64Url(
    crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest(),
  );
}

export function createAuthToken(user: AuthUser) {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const payload = {
    sub: user.id,
    username: user.username,
    displayName: user.displayName,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };

  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = signTokenPayload(encodedHeader, encodedPayload);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token?: string | null): AuthUser | null {
  if (!token) return null;

  const [encodedHeader, encodedPayload, signature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !signature) return null;

  const expectedSignature = signTokenPayload(encodedHeader, encodedPayload);

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    )
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as {
      sub: string;
      username: string;
      displayName: string;
      exp: number;
    };

    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    const user = findUserById(payload.sub);

    if (!user) return null;

    return toPublicUser(user);
  } catch {
    return null;
  }
}

function findUserById(userId: string) {
  return readUsersDatabase().users.find((user) => user.id === userId) ?? null;
}

function findUserByUsername(username: string) {
  const normalizedUsername = normalizeUsername(username);

  return (
    readUsersDatabase().users.find(
      (user) => normalizeUsername(user.username) === normalizedUsername,
    ) ?? null
  );
}

export function registerUser(payload: {
  username: string;
  password: string;
  displayName?: string;
}) {
  const username = normalizeUsername(payload.username);
  const displayName = payload.displayName?.trim() || username;

  if (username.length < 3) {
    throw new Error("Username cần ít nhất 3 ký tự.");
  }

  if (payload.password.length < 6) {
    throw new Error("Password cần ít nhất 6 ký tự.");
  }

  const database = readUsersDatabase();

  if (
    database.users.some((user) => normalizeUsername(user.username) === username)
  ) {
    throw new Error("Username này đã tồn tại.");
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    username,
    displayName,
    passwordHash: hashPassword(payload.password),
    createdAt: new Date().toISOString(),
  };

  database.users.push(user);
  writeUsersDatabase(database);

  return {
    user: toPublicUser(user),
    token: createAuthToken(toPublicUser(user)),
  };
}

export function loginUser(payload: {
  username: string;
  password: string;
}) {
  const user = findUserByUsername(payload.username);

  if (!user || !verifyPassword(payload.password, user.passwordHash)) {
    throw new Error("Sai username hoặc password.");
  }

  return {
    user: toPublicUser(user),
    token: createAuthToken(toPublicUser(user)),
  };
}

function getBearerToken(request: http.IncomingMessage) {
  const authorization = request.headers.authorization;

  if (!authorization) return null;

  const [scheme, token] = authorization.split(" ");

  return scheme?.toLowerCase() === "bearer" ? token : null;
}

function sendJson(
  response: http.ServerResponse,
  statusCode: number,
  payload: unknown,
) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody<T>(request: http.IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf-8");

  return rawBody ? (JSON.parse(rawBody) as T) : ({} as T);
}

export async function handleAuthHttpRequest(
  request: http.IncomingMessage,
  response: http.ServerResponse,
): Promise<boolean> {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return true;
  }

  if (!requestUrl.pathname.startsWith("/auth/")) {
    return false;
  }

  try {
    if (request.method === "POST" && requestUrl.pathname === "/auth/register") {
      const body = await readJsonBody<{
        username: string;
        password: string;
        displayName?: string;
      }>(request);

      sendJson(response, 200, registerUser(body));
      return true;
    }

    if (request.method === "POST" && requestUrl.pathname === "/auth/login") {
      const body = await readJsonBody<{
        username: string;
        password: string;
      }>(request);

      sendJson(response, 200, loginUser(body));
      return true;
    }

    if (request.method === "GET" && requestUrl.pathname === "/auth/me") {
      const user = verifyAuthToken(getBearerToken(request));

      if (!user) {
        sendJson(response, 401, {
          message: "Chưa đăng nhập hoặc token hết hạn.",
        });
        return true;
      }

      sendJson(response, 200, { user });
      return true;
    }

    sendJson(response, 404, { message: "Không tìm thấy auth endpoint." });
    return true;
  } catch (error) {
    sendJson(response, 400, {
      message: error instanceof Error
        ? error.message
        : "Auth request không hợp lệ.",
    });
    return true;
  }
}
