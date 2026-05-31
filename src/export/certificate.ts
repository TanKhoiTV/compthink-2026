import type { TravelCard } from "../shared/types.ts";
import {
	getBoardSlots,
	getCurrentDayIndex,
	getAccumulatedVP,
} from "../state.ts";
import { calculateScoreBreakdown } from "../shared/scoring.ts";
import { getRemainingResources } from "../shared/resources.ts";
import {
	STARTING_COIN,
	STARTING_STAMINA,
	PHASE_DAYS,
} from "../shared/constants.ts";

const TIME_LABELS = ["Sáng", "Trưa", "Chiều", "Tối", "Khuya"];

type TimelineSlot = {
	timeLabel: string;
	card: {
		id: string;
		name: string;
		city: string;
		tag: string;
		tagLabel: string;
		vp: number;
		coin: number;
		stamina: number;
		description: string;
	} | null;
};

type TimelineDay = {
	label: string;
	slots: TimelineSlot[];
};

export type TimelineExportData = {
	version: number;
	createdAt: string;
	playerName: string;
	dayIndex: number;
	score: {
		baseVP: number;
		bonusVP: number;
		totalVP: number;
		finalScore: number;
		debtPenalty: number;
	};
	resources: {
		spentCoin: number;
		spentStamina: number;
		remainingCoin: number;
		remainingStamina: number;
		usedSlots: number;
	};
	timeline: TimelineDay[];
};

export function buildTravelTimelineExport(): TimelineExportData {
	const boardSlots = getBoardSlots();
	const placedCards: TravelCard[] = [];

	for (let r = 0; r < 5; r++) {
		for (let d = 0; d < PHASE_DAYS; d++) {
			const card = boardSlots[r]?.[d];
			if (card) placedCards.push(card);
		}
	}

	const breakdown = calculateScoreBreakdown({
		placedCards,
		getBoardDisplayName: (c: TravelCard) => c.name,
	});
	const spentCoin = placedCards.reduce((s, c) => s + c.coin, 0);
	const spentStamina = placedCards.reduce((s, c) => s + c.stamina, 0);
	const remaining = getRemainingResources({
		totals: {
			vp: breakdown.totalVP,
			coin: spentCoin,
			stamina: spentStamina,
			usedSlots: placedCards.length,
		},
		startingCoin: STARTING_COIN,
		startingStamina: STARTING_STAMINA,
	});
	const createdAt = new Date().toISOString();

	const timeline: TimelineDay[] = Array.from(
		{ length: PHASE_DAYS },
		(_, dayIdx) => ({
			label: `Ngày ${dayIdx + 1}`,
			slots: TIME_LABELS.map((timeLabel, rowIdx) => {
				const card = boardSlots[rowIdx]?.[dayIdx] ?? null;
				return {
					timeLabel,
					card: card
						? {
								id: card.id,
								name: card.name,
								city: card.city ?? "",
								tag: card.tag ?? card.tags?.[0] ?? "FOOD",
								tagLabel: getTagLabel(card.tag ?? card.tags?.[0] ?? "FOOD"),
								vp: card.vp,
								coin: card.coin,
								stamina: card.stamina,
								description: card.description ?? "",
							}
						: null,
				};
			}),
		}),
	);

	const accumulated = getAccumulatedVP();

	return {
		version: 1,
		createdAt,
		playerName: "Player",
		dayIndex: getCurrentDayIndex(),
		score: {
			baseVP: breakdown.baseVP,
			bonusVP: breakdown.bonusVP,
			totalVP: breakdown.totalVP,
			finalScore: accumulated,
			debtPenalty: breakdown.totalVP - accumulated,
		},
		resources: {
			spentCoin,
			spentStamina,
			remainingCoin: remaining.coin,
			remainingStamina: remaining.stamina,
			usedSlots: placedCards.length,
		},
		timeline,
	};
}

function getTagLabel(tag: string): string {
	const labels: Record<string, string> = {
		FOOD: "Ẩm thực",
		CULTURE: "Văn hoá",
		ADVENTURE: "Phiêu lưu",
		RELAX: "Thư giãn",
		SHOPPING: "Mua sắm",
		NATURE: "Thiên nhiên",
	};
	return labels[tag] ?? tag;
}

function escapeHtml(value: string): string {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

export function buildTravelCertificateHtml(): string {
	const data = buildTravelTimelineExport();

	const daysHtml = data.timeline
		.map(
			(day) => `
          <article class="day-card${day.slots.every((s) => !s.card) ? " empty" : ""}">
            <h4>${escapeHtml(day.label)}</h4>
            <div class="slots">
              ${day.slots
								.map((slot) => {
									if (!slot.card) {
										return `
                        <div class="slot empty">
                          <em>${escapeHtml(slot.timeLabel)}</em>
                          <strong>Nghỉ / Di chuyển</strong>
                          <small>Chưa có hoạt động</small>
                        </div>`;
									}
									return `
                        <div class="slot">
                          <em>${escapeHtml(slot.timeLabel)}</em>
                          <strong>${escapeHtml(slot.card.name)}</strong>
                          <small>${escapeHtml(slot.card.city || "Không rõ khu vực")}</small>
                          <span>+${slot.card.vp} VP</span>
                          <small>${escapeHtml(slot.card.tagLabel || slot.card.tag)}</small>
                        </div>`;
								})
								.join("")}
            </div>
          </article>`,
		)
		.join("");

	return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Chứng nhận hành trình</title>
  <style>
    :root {
      --ink: #4e3325;
      --muted: rgba(78, 51, 37, 0.68);
      --gold: #d99a2b;
      --gold-dark: #9b641f;
      --paper: #fff7e8;
      --violet: #7c3aed;
    }
    * { box-sizing: border-box; }
    html { -webkit-font-smoothing: antialiased; }
    body {
      margin: 0; min-height: 100vh;
      background: radial-gradient(circle at 50% 0%, rgba(255,255,255,.92), transparent 38%),
                  linear-gradient(180deg, #efe1c8, #d7bd8d);
      color: var(--ink);
      font-family: system-ui, -apple-system, sans-serif;
      display: grid; place-items: center;
      padding: 22px;
    }
    .certificate {
      width: min(980px, 100%);
      background: radial-gradient(circle at 15% 8%, rgba(255,255,255,.9), transparent 26%),
                  radial-gradient(circle at 85% 92%, rgba(255,255,255,.55), transparent 30%),
                  linear-gradient(180deg, #fff8ea, #f3dfb8);
      border: 3px double rgba(168, 111, 31, .72);
      border-radius: 28px;
      box-shadow: 0 28px 80px rgba(82, 49, 19, .24), inset 0 0 0 10px rgba(255,255,255,.32);
      padding: 34px;
      position: relative; overflow: hidden;
    }
    .certificate::before, .certificate::after {
      content: ""; position: absolute;
      width: 360px; height: 360px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(217,154,43,.12), transparent 68%);
      pointer-events: none;
    }
    .certificate::before { left: -170px; top: -170px; }
    .certificate::after { right: -170px; bottom: -170px; }
    .toolbar {
      position: sticky; top: 0; z-index: 4;
      display: flex; justify-content: flex-end; gap: 10px;
      margin-bottom: 12px;
    }
    .toolbar button {
      cursor: pointer; border: 0; border-radius: 999px;
      padding: 10px 14px; color: white;
      background: linear-gradient(135deg, #8b5cf6, #6d28d9);
      font-weight: 800;
      box-shadow: 0 10px 18px rgba(109, 40, 217, .22);
    }
    .header { text-align: center; position: relative; z-index: 1; }
    .compass {
      width: 54px; height: 54px; margin: 0 auto 8px;
      display: grid; place-items: center;
      border: 2px solid rgba(155, 100, 31, .36); border-radius: 50%;
      color: var(--gold-dark); font-size: 30px;
      background: rgba(255,255,255,.36);
    }
    .header h1 {
      margin: 0; font-size: clamp(34px, 5vw, 58px);
      font-weight: 900; text-transform: uppercase;
      text-shadow: 0 2px 0 rgba(255,255,255,.65);
    }
    .subtitle { margin-top: 8px; color: var(--gold-dark); font-size: 20px; }
    .player {
      margin-top: 22px;
      font-size: clamp(34px, 4.4vw, 54px);
      font-weight: 900; line-height: 1.15;
    }
    .score-panel {
      width: min(620px, 100%); margin: 20px auto 10px;
      display: flex; align-items: center; justify-content: center;
      gap: 18px; border: 2px solid rgba(188, 129, 48, .52);
      border-radius: 22px; padding: 14px 24px;
      background: rgba(255,255,255,.42);
    }
    .score-panel span { font-size: 21px; font-weight: 800; }
    .score-panel strong { color: #d97706; font-size: clamp(52px, 7vw, 86px); line-height: .9; }
    .score-breakdown-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px 16px;
      margin: 0 auto 10px;
      font-size: 15px;
      color: var(--muted, #6b5c4e);
    }
    .debt-penalty {
      color: #dc2626;
      font-weight: 700;
    }
    .timeline {
      position: relative; z-index: 1;
      border: 2px solid rgba(174, 116, 39, .32); border-radius: 24px;
      padding: 20px; background: rgba(255,255,255,.38);
      margin-top: 20px;
    }
    .timeline h3 { margin: 0 0 16px; font-size: 28px; }
    .days { display: grid; gap: 14px; }
    .day-card {
      border: 1px solid rgba(174, 116, 39, .28); border-radius: 18px;
      background: rgba(255, 251, 239, .78); padding: 14px;
    }
    .day-card h4 { margin: 0 0 10px; font-size: 20px; }
    .slots { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
    .slot {
      min-height: 116px; border: 1px dashed rgba(160, 115, 66, .46);
      border-radius: 14px; padding: 10px; background: rgba(255,255,255,.45);
    }
    .slot em { display: block; font-style: normal; font-weight: 900; margin-bottom: 6px; }
    .slot strong { display: block; min-height: 34px; font-size: 15px; line-height: 1.12; }
    .slot span { color: #15803d; display: block; font-weight: 900; margin-top: 7px; }
    .slot small { display: block; margin-top: 4px; line-height: 1.25; }
    .empty { opacity: .58; }
    .footer { margin-top: 24px; text-align: center; color: var(--muted); font-size: 15px; }
    .signature { display: block; margin-top: 6px; font-size: 28px; font-style: italic; }
    .badges {
      margin-top: 18px; display: grid;
      grid-template-columns: repeat(4, 1fr); gap: 10px;
      position: relative; z-index: 1;
    }
    .badge {
      border: 1px solid rgba(174, 116, 39, .28); border-radius: 999px;
      background: rgba(255,255,255,.42); padding: 12px; text-align: center;
      font-weight: 800;
    }
    @media print {
      body { background: white; padding: 0; }
      .toolbar { display: none; }
      .certificate { box-shadow: none; border-radius: 0; width: 100%; }
    }
    @media (max-width: 760px) {
      .certificate { padding: 22px; }
      .badges { grid-template-columns: 1fr; }
      .slots { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="certificate">
    <div class="toolbar">
      <button onclick="window.print()">In / Lưu PDF</button>
    </div>
    <section class="header">
      <div class="compass">✦</div>
      <h1>Chứng nhận hành trình</h1>
      <div class="subtitle">Tổng kết chuyến đi</div>
      <div class="player">${escapeHtml(data.playerName)}</div>
      <div class="score-panel">
        <span>TỔNG ĐIỂM</span>
        <strong>${data.score.finalScore}</strong>
        <span>VP</span>
      </div>
      <div class="score-breakdown-row">
        <span>Điểm cơ bản: ${data.score.baseVP} VP</span>
        <span>Thưởng combo: +${data.score.bonusVP} VP</span>
        ${
					data.score.debtPenalty > 0
						? `<span class="debt-penalty">Nợ xu: -${data.score.debtPenalty} VP</span>`
						: ""
				}
      </div>
    </section>
    <section class="timeline">
      <h3>Hành trình</h3>
      <div class="days">${daysHtml}</div>
    </section>
    <section class="badges">
      <div class="badge">🍽️ Ẩm thực nổi bật</div>
      <div class="badge">📅 Lịch trình hiệu quả</div>
      <div class="badge">🏔️ Khám phá bền bỉ</div>
      <div class="badge">🏆 Hoàn thành chuyến đi</div>
    </section>
    <footer class="footer">
      <div>Ngày xuất: ${new Date(data.createdAt).toLocaleDateString("vi-VN")}</div>
      <span class="signature">Trekkopoly</span>
    </footer>
  </main>
</body>
</html>`;
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

export function downloadTravelCertificateHtml() {
	downloadTextFile(
		`chung-nhan-hanh-trinh.html`,
		buildTravelCertificateHtml(),
		"text/html;charset=utf-8",
	);
}

export function formatTravelTimelineAsText(): string {
	const data = buildTravelTimelineExport();
	const lines: string[] = [];

	lines.push("TREKKOPOLY - LỊCH TRÌNH DU LỊCH");
	lines.push(`Người chơi: ${data.playerName}`);
	lines.push(`Ngày xuất: ${new Date(data.createdAt).toLocaleString("vi-VN")}`);
	lines.push("");
	lines.push("TỔNG KẾT");
	lines.push(`- Điểm: ${data.score.totalVP} VP`);
	lines.push(`- Xu đã dùng: ${data.resources.spentCoin}`);
	lines.push(`- Thể lực đã dùng: ${data.resources.spentStamina}`);
	lines.push(`- Slot đã dùng: ${data.resources.usedSlots}/25`);
	lines.push("");

	for (const day of data.timeline) {
		const hasAnyCard = day.slots.some((s) => s.card !== null);
		if (!hasAnyCard) continue;
		lines.push(day.label.toUpperCase());
		for (const slot of day.slots) {
			if (!slot.card) {
				lines.push(`- ${slot.timeLabel}: Nghỉ / Di chuyển`);
				continue;
			}
			lines.push(
				`- ${slot.timeLabel}: ${slot.card.name} (${slot.card.city || "Không rõ khu vực"})`,
			);
			lines.push(
				`  Tag: ${slot.card.tagLabel} • VP: ${slot.card.vp} • Xu: ${slot.card.coin} • Thể lực: ${slot.card.stamina}`,
			);
			if (slot.card.description)
				lines.push(`  Ghi chú: ${slot.card.description}`);
		}
		lines.push("");
	}

	return lines.join("\n");
}

export function downloadTravelTimeline(format: "txt" | "json") {
	const data = buildTravelTimelineExport();

	if (format === "json") {
		downloadTextFile(
			`lich-trinh.json`,
			JSON.stringify(data, null, 2),
			"application/json;charset=utf-8",
		);
		return;
	}

	downloadTextFile(
		`lich-trinh.txt`,
		formatTravelTimelineAsText(),
		"text/plain;charset=utf-8",
	);
}
