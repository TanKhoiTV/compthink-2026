/**
 * auth.ts — User registration, login, and JWT token verification.
 *
 * Ported from Trekkopoly/server/auth.ts to Deno's Web Crypto API.
 * Uses PBKDF2 for password hashing and HMAC-SHA256 for token signing.
 * Stores users in server/data/users.json.
 */

export type AuthUser = {
	id: string;
	username: string;
	displayName: string;
};

interface StoredUser extends AuthUser {
	passwordHash: string;
	createdAt: string;
}

interface UsersDatabase {
	users: StoredUser[];
}

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const PASSWORD_ITERATIONS = 120_000;
const AUTH_SECRET =
	Deno.env.get("AUTH_SECRET") ?? "dev-secret-change-me-before-deploying-online";
const DATA_DIR = new URL("data/", import.meta.url);
const USERS_FILE = new URL("users.json", DATA_DIR);

// ─── File I/O ────────────────────────────────────────────────────────────────

function ensureDataDir() {
	try {
		Deno.mkdirSync(DATA_DIR, { recursive: true });
	} catch {
		// directory already exists
	}
}

function readUsersDatabase(): UsersDatabase {
	ensureDataDir();
	try {
		const text = Deno.readTextFileSync(USERS_FILE);
		return JSON.parse(text) as UsersDatabase;
	} catch {
		return { users: [] };
	}
}

function writeUsersDatabase(database: UsersDatabase): void {
	ensureDataDir();
	Deno.writeTextFileSync(USERS_FILE, JSON.stringify(database, null, 2));
}

// ─── Password hashing (PBKDF2 via Web Crypto) ───────────────────────────────

function base64UrlEncode(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(str: string): Uint8Array {
	const normalized = str.replace(/-/g, "+").replace(/_/g, "/");
	const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);
	const hash = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt,
			iterations: PASSWORD_ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		256,
	);
	const saltB64 = base64UrlEncode(salt.buffer);
	const hashB64 = base64UrlEncode(hash);
	return `${PASSWORD_ITERATIONS}:${saltB64}:${hashB64}`;
}

async function verifyPassword(
	password: string,
	stored: string,
): Promise<boolean> {
	const parts = stored.split(":");
	if (parts.length !== 3) return false;
	const [iterationsStr, saltB64, expectedHashB64] = parts;
	const iterations = parseInt(iterationsStr, 10);
	if (!iterations || !saltB64 || !expectedHashB64) return false;

	const salt = base64UrlDecode(saltB64);
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);
	const actualHash = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt,
			iterations,
			hash: "SHA-256",
		},
		keyMaterial,
		256,
	);
	const actualHashB64 = base64UrlEncode(actualHash);
	return actualHashB64 === expectedHashB64;
}

// ─── JWT signing (HMAC-SHA256 via Web Crypto) ───────────────────────────────

async function hmacSign(data: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(AUTH_SECRET),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(data),
	);
	return base64UrlEncode(signature);
}

async function createAuthToken(user: AuthUser): Promise<string> {
	const header = { alg: "HS256", typ: "JWT" };
	const payload = {
		sub: user.id,
		username: user.username,
		displayName: user.displayName,
		exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
	};

	const encodedHeader = base64UrlEncode(
		new TextEncoder().encode(JSON.stringify(header)),
	);
	const encodedPayload = base64UrlEncode(
		new TextEncoder().encode(JSON.stringify(payload)),
	);
	const signature = await hmacSign(`${encodedHeader}.${encodedPayload}`);

	return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// ─── User lookups ────────────────────────────────────────────────────────────

function findUserById(userId: string): StoredUser | null {
	return readUsersDatabase().users.find((u) => u.id === userId) ?? null;
}

function normalizeUsername(username: string): string {
	return username.trim().toLowerCase();
}

function findUserByUsername(username: string): StoredUser | null {
	const normalized = normalizeUsername(username);
	return (
		readUsersDatabase().users.find(
			(u) => normalizeUsername(u.username) === normalized,
		) ?? null
	);
}

function toPublicUser(user: StoredUser): AuthUser {
	return {
		id: user.id,
		username: user.username,
		displayName: user.displayName,
	};
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function registerUser(payload: {
	username: string;
	password: string;
	displayName?: string;
}): Promise<{ user: AuthUser; token: string }> {
	const username = normalizeUsername(payload.username);
	const displayName = payload.displayName?.trim() || username;

	if (username.length < 3) {
		throw new Error("Username cần ít nhất 3 ký tự.");
	}
	if (payload.password.length < 6) {
		throw new Error("Password cần ít nhất 6 ký tự.");
	}

	const database = readUsersDatabase();
	if (database.users.some((u) => normalizeUsername(u.username) === username)) {
		throw new Error("Username này đã tồn tại.");
	}

	const user: StoredUser = {
		id: crypto.randomUUID(),
		username,
		displayName,
		passwordHash: await hashPassword(payload.password),
		createdAt: new Date().toISOString(),
	};

	database.users.push(user);
	writeUsersDatabase(database);

	const publicUser = toPublicUser(user);
	const token = await createAuthToken(publicUser);
	return { user: publicUser, token };
}

export async function loginUser(payload: {
	username: string;
	password: string;
}): Promise<{ user: AuthUser; token: string }> {
	const user = findUserByUsername(payload.username);
	if (!user) {
		throw new Error("Sai username hoặc password.");
	}
	const valid = await verifyPassword(payload.password, user.passwordHash);
	if (!valid) {
		throw new Error("Sai username hoặc password.");
	}

	const publicUser = toPublicUser(user);
	const token = await createAuthToken(publicUser);
	return { user: publicUser, token };
}

export async function verifyAuthToken(
	token?: string | null,
): Promise<AuthUser | null> {
	if (!token) return null;

	const parts = token.split(".");
	if (parts.length !== 3) return null;

	const [encodedHeader, encodedPayload, signature] = parts;
	const expectedSignature = await hmacSign(
		`${encodedHeader}.${encodedPayload}`,
	);

	// Constant-time comparison
	const sigBuf = new TextEncoder().encode(signature);
	const expectedBuf = new TextEncoder().encode(expectedSignature);
	if (sigBuf.length !== expectedBuf.length) return null;
	let mismatch = 0;
	for (let i = 0; i < sigBuf.length; i++) {
		mismatch |= sigBuf[i] ^ expectedBuf[i];
	}
	if (mismatch !== 0) return null;

	try {
		const payloadText = new TextDecoder().decode(
			base64UrlDecode(encodedPayload),
		);
		const payload = JSON.parse(payloadText) as {
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

export async function handleAuthRequest(
	req: Request,
): Promise<Response | null> {
	const url = new URL(req.url);
	const { pathname, method } = url;

	// Only handle /api/auth/* paths
	if (!pathname.startsWith("/api/auth/")) return null;

	try {
		// POST /api/auth/register
		if (method === "POST" && pathname === "/api/auth/register") {
			const body = await req.json();
			const result = await registerUser({
				username: body.username,
				password: body.password,
				displayName: body.displayName,
			});
			return jsonResponse(200, result);
		}

		// POST /api/auth/login
		if (method === "POST" && pathname === "/api/auth/login") {
			const body = await req.json();
			const result = await loginUser({
				username: body.username,
				password: body.password,
			});
			return jsonResponse(200, result);
		}

		// GET /api/auth/me
		if (method === "GET" && pathname === "/api/auth/me") {
			const authHeader = req.headers.get("Authorization") || "";
			const token = authHeader.startsWith("Bearer ")
				? authHeader.slice(7)
				: null;
			const user = await verifyAuthToken(token);
			if (!user) {
				return jsonResponse(401, {
					message: "Chưa đăng nhập hoặc token hết hạn.",
				});
			}
			return jsonResponse(200, { user });
		}

		return jsonResponse(404, { message: "Không tìm thấy auth endpoint." });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		return jsonResponse(400, { message });
	}
}

function jsonResponse(status: number, data: unknown): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}
