import { vi } from "vitest";

(globalThis as any).io ??= () => ({
	on: vi.fn(),
	emit: vi.fn(),
	off: vi.fn(),
	connect: vi.fn(),
	disconnect: vi.fn(),
	id: "mock-socket-id",
});

(globalThis as any).localStorage ??= {
	getItem: () => null,
	setItem: () => {},
	removeItem: () => {},
	clear: () => {},
	key: () => null,
	length: 0,
};
