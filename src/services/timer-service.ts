/**
 * Timer Service - Centralized timer management
 *
 * Provides a clean API for creating, tracking, and cleaning up timers.
 * Helps prevent memory leaks and makes timer lifecycle management explicit.
 */

interface TimerHandle {
	id: number;
	label: string;
	createdAt: number;
}

const activeTimers = new Map<number, TimerHandle>();

/**
 * Create a timer with automatic tracking and cleanup
 * @param callback - Function to execute
 * @param delayMs - Delay in milliseconds
 * @param label - Descriptive label for debugging
 * @returns Timer ID for manual cleanup
 */
export function setTimer(
	callback: () => void,
	delayMs: number,
	label: string,
): number {
	const id = window.setTimeout(() => {
		try {
			callback();
		} finally {
			activeTimers.delete(id);
		}
	}, delayMs);

	activeTimers.set(id, {
		id,
		label,
		createdAt: Date.now(),
	});

	return id;
}

/**
 * Create a repeating interval with automatic tracking
 * @param callback - Function to execute repeatedly
 * @param intervalMs - Interval in milliseconds
 * @param label - Descriptive label for debugging
 * @returns Interval ID for manual cleanup
 */
export function setIntervalTimer(
	callback: () => void,
	intervalMs: number,
	label: string,
): number {
	const id = window.setInterval(callback, intervalMs);

	activeTimers.set(id, {
		id,
		label,
		createdAt: Date.now(),
	});

	return id;
}

/**
 * Clear a timer and remove it from tracking
 * @param timerId - ID returned from setTimer or setIntervalTimer
 */
export function clearTimer(timerId: number): void {
	if (activeTimers.has(timerId)) {
		window.clearTimeout(timerId);
		activeTimers.delete(timerId);
	}
}

/**
 * Clear an interval and remove it from tracking
 * @param intervalId - ID returned from setIntervalTimer
 */
export function clearIntervalTimer(intervalId: number): void {
	if (activeTimers.has(intervalId)) {
		window.clearInterval(intervalId);
		activeTimers.delete(intervalId);
	}
}

/**
 * Clear all active timers (useful for cleanup on page unload)
 */
export function clearAllTimers(): void {
	activeTimers.forEach((timer) => {
		window.clearTimeout(timer.id);
		window.clearInterval(timer.id);
	});
	activeTimers.clear();
}

/**
 * Get debug information about active timers
 * @returns Array of active timer info
 */
export function getActiveTimers(): TimerHandle[] {
	return Array.from(activeTimers.values());
}

/**
 * Log active timers to console (for debugging)
 */
export function logActiveTimers(): void {
	console.log("Active timers:", getActiveTimers());
}

// Auto-cleanup on page unload
if (typeof window !== "undefined") {
	window.addEventListener("beforeunload", clearAllTimers);
}
