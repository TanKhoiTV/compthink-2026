/**
 * auth.test.ts — Unit tests for server auth module.
 *
 * Run: deno test --allow-read --allow-write --allow-env server/auth.test.ts
 */

import { assertEquals, assertRejects, assertThrows } from "jsr:@std/assert";
import { registerUser, loginUser, verifyAuthToken } from "./auth.ts";
import type { AuthUser } from "./auth.ts";

// Use unique test prefix to avoid collisions between runs
const U = () => `test_${crypto.randomUUID().slice(0, 8)}`;

Deno.test("registerUser — creates user and returns token", async () => {
	const user = U();
	const result = await registerUser({
		username: user,
		password: "password123",
		displayName: "Test User",
	});

	assertEquals(result.user.username, user);
	assertEquals(result.user.displayName, "Test User");
	assertEquals(typeof result.user.id, "string");
	assertEquals(result.user.id.length > 0, true);
	assertEquals(typeof result.token, "string");
	assertEquals(result.token.includes("."), true);
});

Deno.test("registerUser — rejects short username", async () => {
	await assertRejects(
		() => registerUser({ username: "ab", password: "password123" }),
		Error,
		"ít nhất 3 ký tự",
	);
});

Deno.test("registerUser — rejects short password", async () => {
	await assertRejects(
		() => registerUser({ username: "validuser", password: "12345" }),
		Error,
		"ít nhất 6 ký tự",
	);
});

Deno.test("registerUser — rejects duplicate username", async () => {
	const user = U();
	await registerUser({
		username: user,
		password: "password123",
	});

	await assertRejects(
		() => registerUser({ username: user.toUpperCase(), password: "otherpass" }),
		Error,
		"đã tồn tại",
	);
});

Deno.test("loginUser — returns token on valid credentials", async () => {
	const user = U();
	await registerUser({ username: user, password: "password123" });

	const result = await loginUser({
		username: user,
		password: "password123",
	});

	assertEquals(result.user.username, user);
	assertEquals(typeof result.token, "string");
});

Deno.test("loginUser — rejects wrong password", async () => {
	const user = U();
	await registerUser({ username: user, password: "password123" });

	await assertRejects(
		() => loginUser({ username: user, password: "wrongpass" }),
		Error,
		"Sai username",
	);
});

Deno.test("loginUser — rejects nonexistent user", async () => {
	await assertRejects(
		() =>
			loginUser({ username: "nonexistent_user_xyz", password: "password123" }),
		Error,
		"Sai username",
	);
});

Deno.test("verifyAuthToken — returns user for valid token", async () => {
	const user = U();
	const { token } = await registerUser({
		username: user,
		password: "password123",
		displayName: "Verify User",
	});

	const result = await verifyAuthToken(token);
	assertEquals(result?.username, user);
	assertEquals(result?.displayName, "Verify User");
});

Deno.test("verifyAuthToken — returns null for null/undefined", async () => {
	assertEquals(await verifyAuthToken(null), null);
	assertEquals(await verifyAuthToken(undefined), null);
});

Deno.test("verifyAuthToken — returns null for malformed token", async () => {
	assertEquals(await verifyAuthToken("not-a-token"), null);
	assertEquals(await verifyAuthToken("a.b.c.d"), null);
});

Deno.test("verifyAuthToken — returns null for tampered token", async () => {
	const user = U();
	const { token } = await registerUser({
		username: user,
		password: "password123",
	});

	// Tamper with the payload part
	const parts = token.split(".");
	const tampered = `${parts[0]}.${parts[1]}X.${parts[2]}`;
	assertEquals(await verifyAuthToken(tampered), null);
});

Deno.test("registerUser — case insensitive username", async () => {
	const user = U();
	await registerUser({
		username: user,
		password: "password123",
	});

	await assertRejects(
		() => registerUser({ username: user.toUpperCase(), password: "password123" }),
		Error,
		"đã tồn tại",
	);
});

Deno.test("loginUser — case insensitive username", async () => {
	const user = U();
	await registerUser({
		username: user,
		password: "password123",
	});
	const result = await loginUser({
		username: user.toUpperCase(),
		password: "password123",
	});
	assertEquals(result.user.username, user);
});
