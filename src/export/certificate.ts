/**
 * certificate.ts — Travel board certificate export.
 *
 * Extracted from TREKPOLOGY/src/export/certificate.ts.
 * Imports state from state.ts instead of app.ts.
 */
import { onlineClientState } from "../online/socketClient.ts";
import type { TravelCardData } from "../../scr/shared/client-types.ts";
import { days, rows } from "../../scr/shared/constants.ts";
import {
	getBoardSlots,
	getRemainingResources,
	getPhaseNumber,
	getCurrentDayIndex,
	getAccumulatedVP,
	currentPlayerId,
} from "../state.ts";
import { getDisplayPlayerName } from "../router.ts";

const CERTIFICATE_HISTORY_STORAGE_KEY = "travel_board_certificate_history";

type CertificateSlotSnapshot = {
	name: string;
	image: string;
	tag: string;
	coin: number;
	stamina: number;
	vp: number;
};

type CertificateHistoryEntry = {
	playerName: string;
	phaseNumber: number;
	dayIndex: number;
	totalVp: number;
	timestamp: string;
	boardSlots: CertificateSlotSnapshot[][];
};

export function getSavedCertificateHistory(): CertificateHistoryEntry[] {
	try {
		const raw = localStorage.getItem(CERTIFICATE_HISTORY_STORAGE_KEY);
		return raw ? (JSON.parse(raw) as CertificateHistoryEntry[]) : [];
	} catch {
		return [];
	}
}

export function getPhaseNumber(): number {
	return getPhaseNumber();
}

export function getCurrentDayIndex(): number {
	return getCurrentDayIndex();
}

export function saveCertificateHistoryEntry(): void {
	const board = getBoardSlots();
	const playerName: string = getDisplayPlayerName();
	const phaseNum: number = getPhaseNumber();
	const dayIdx: number = getCurrentDayIndex();
	const totalVp: number = getAccumulatedVP();

	const slotSnapshots: CertificateSlotSnapshot[][] = board.map((row) =>
		row.map((card: TravelCardData | null) => {
			if (!card) {
				return { name: "", image: "", tag: "", coin: 0, stamina: 0, vp: 0 };
			}
			return {
				name: card.name,
				image: card.image ?? "",
				tag: card.tag ?? "",
				coin: card.coin ?? 0,
				stamina: card.stamina ?? 0,
				vp: card.vp ?? 0,
			};
		}),
	);

	const entry: CertificateHistoryEntry = {
		playerName,
		phaseNumber: phaseNum,
		dayIndex: dayIdx,
		totalVp,
		timestamp: new Date().toISOString(),
		boardSlots: slotSnapshots,
	};

	const history = getSavedCertificateHistory();
	history.push(entry);
	localStorage.setItem(
		CERTIFICATE_HISTORY_STORAGE_KEY,
		JSON.stringify(history),
	);
}

export function renderCertificateDataUri(): string {
	const board = getBoardSlots();
	const totalVp: number = getAccumulatedVP();
	const resources = getRemainingResources();
	const playerName: string = getDisplayPlayerName();
	const phaseNum: number = getPhaseNumber();
	const dayIdx: number = getCurrentDayIndex();

	const header = `Travel Board Certificate
========================
Người chơi: ${playerName}
Phase: ${phaseNum} • Day: ${dayIdx + 1}
Tổng VP: ${totalVp}
Xu còn lại: ${resources.xu} • Stamina: ${resources.stamina}

Lịch trình:`;

	const body = board
		.map((row, ri) =>
			row
				.map((card: TravelCardData | null, ci: number) => {
					if (!card) return `[${days[ci] ?? ci}][${rows[ri] ?? ri}]: Trống`;
					return `[${days[ci] ?? ci}][${rows[ri] ?? ri}]: ${card.name} (${card.vp} VP, ${card.tag})`;
				})
				.join("\n"),
		)
		.join("\n");

	return `data:text/plain;charset=utf-8,${encodeURIComponent(`${header}\n${body}`)}`;
}
