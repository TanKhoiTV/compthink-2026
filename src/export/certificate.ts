import { onlineClientState } from "../online/socketClient.js";
import type { TravelCardData } from "../types.js";
import { days, rows } from "../game/constants.js";
import { state, currentPlayerId } from "../state/gameState.js";
import { 
  getBoardSlots, 
  getCurrentScoreBreakdown, 
  getRemainingResources, 
  getDisplayPlayerName,
  isOnlineRoomActive,
} from "../app.js";

const CERTIFICATE_HISTORY_STORAGE_KEY = "travel_board_certificate_history";

type CertificateSlotSnapshot = {
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

type CertificateDaySnapshot = {
  day: number;
  label: string;
  slots: CertificateSlotSnapshot[];
};

type CertificatePhaseSnapshot = {
  phaseNumber: number;
  phaseScore: number;
  completedDays: number;
  completedSlots: number;
  styleLabel: string;
  days: CertificateDaySnapshot[];
  updatedAt: string;
};


export function getExportFileSafeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "lich-trinh";
}

export function buildTravelTimelineExport() {
  const boardSlots = getBoardSlots();
  const breakdown = getCurrentScoreBreakdown();
  const remaining = getRemainingResources();
  const createdAt = new Date().toISOString();

  const timeline = days.map((day, dayIndex) => {
    return {
      day,
      label: `Ngày ${day}`,
      slots: rows.map((timeLabel, rowIndex) => {
        const card = boardSlots[rowIndex]?.[dayIndex] ?? null;

        return {
          timeLabel,
          card: card
            ? {
                id: card.id,
                name: card.name,
                city: card.city,
                tag: card.tag,
                tagLabel: card.tagLabel,
                vp: card.vp,
                coin: card.coin,
                stamina: card.stamina,
                description: card.description,
              }
            : null,
        };
      }),
    };
  });

  return {
    version: 1,
    createdAt,
    playerName: getDisplayPlayerName(),
    phaseNumber: state.phaseNumber,
    currentDay: days[state.currentDayIndex],
    score: {
      baseVP: breakdown.baseVP,
      bonusVP: breakdown.bonusVP,
      totalVP: state.simulationResult?.finalVP ?? breakdown.totalVP,
      accumulatedVP: state.accumulatedVP,
    },
    resources: {
      spentCoin: breakdown.spentCoin,
      spentStamina: breakdown.spentStamina,
      remainingCoin: remaining.coin,
      remainingStamina: remaining.stamina,
      usedSlots: breakdown.usedSlots,
    },
    timeline,
  };
}

export function getCertificateHistoryStorageKey() {
  return `${CERTIFICATE_HISTORY_STORAGE_KEY}:${onlineClientState.roomId ?? "local"}:${onlineClientState.playerId ?? currentPlayerId}`;
}

export function loadCertificateHistory(): CertificatePhaseSnapshot[] {
  try {
    const raw = localStorage.getItem(getCertificateHistoryStorageKey());

    if (!raw) return [];

    const parsed = JSON.parse(raw) as CertificatePhaseSnapshot[];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCertificateHistory(phases: CertificatePhaseSnapshot[]) {
  localStorage.setItem(getCertificateHistoryStorageKey(), JSON.stringify(phases));
}

export function getPhaseStyleLabel(cards: Array<{ tag: string; tagLabel: string }>) {
  if (cards.length === 0) return "Chưa có dữ liệu";

  const tagCounts = new Map<string, { label: string; count: number }>();

  for (const card of cards) {
    const key = card.tag || "unknown";
    const current = tagCounts.get(key) ?? {
      label: card.tagLabel || card.tag || "Khác",
      count: 0,
    };

    current.count += 1;
    tagCounts.set(key, current);
  }

  const sorted = [...tagCounts.values()].sort((a, b) => b.count - a.count);

  if (sorted.length >= 2 && sorted[0].count === sorted[1].count) {
    return "Kết hợp";
  }

  return sorted[0]?.label ?? "Kết hợp";
}

export function createCertificatePhaseSnapshot(phaseToSnapshot = state.phaseNumber): CertificatePhaseSnapshot {
  const boardSlots = getBoardSlots();
  const daysSnapshot = days.map((day, dayIndex) => {
    return {
      day,
      label: `Ngày ${day}`,
      slots: rows.map((timeLabel, rowIndex) => {
        const card = boardSlots[rowIndex]?.[dayIndex] ?? null;

        return {
          timeLabel,
          card: card
            ? {
                id: card.id,
                name: card.name,
                city: card.city,
                tag: card.tag,
                tagLabel: card.tagLabel,
                vp: card.vp,
                coin: card.coin,
                stamina: card.stamina,
                description: card.description,
              }
            : null,
        };
      }),
    };
  });

  const cards: Array<NonNullable<CertificateSlotSnapshot["card"]>> = [];

  for (const day of daysSnapshot) {
    for (const slot of day.slots) {
      if (slot.card) {
        cards.push(slot.card);
      }
    }
  }

  const completedDays = daysSnapshot.filter((day: CertificateDaySnapshot) => {
    return day.slots.some((slot: CertificateSlotSnapshot) => slot.card !== null);
  }).length;

  const completedSlots = cards.length;
  const phaseScore = cards.reduce((sum: number, card: NonNullable<CertificateSlotSnapshot["card"]>) => {
    return sum + card.vp;
  }, 0);

  return {
    phaseNumber: phaseToSnapshot,
    phaseScore,
    completedDays,
    completedSlots,
    styleLabel: getPhaseStyleLabel(cards),
    days: daysSnapshot,
    updatedAt: new Date().toISOString(),
  };
}

export function rememberCurrentCertificatePhase() {
  if (!isOnlineRoomActive()) return;
  if (!onlineClientState.roomState) return;
  if (onlineClientState.roomState.phase === "lobby" || onlineClientState.roomState.phase === "draft") return;

  const snapshot = createCertificatePhaseSnapshot(state.phaseNumber);

  /*
    Không ghi đè phase cũ bằng board rỗng lúc server vừa reset qua phase mới.
    Chỉ lưu khi phase hiện tại đã có ít nhất 1 slot được xếp.
  */
  if (snapshot.completedSlots <= 0) return;

  const history = loadCertificateHistory();
  const nextHistory = history.filter((phase) => phase.phaseNumber !== snapshot.phaseNumber);

  nextHistory.push(snapshot);
  nextHistory.sort((a, b) => a.phaseNumber - b.phaseNumber);
  saveCertificateHistory(nextHistory);
}

export function getCertificateExportData() {
  rememberCurrentCertificatePhase();

  const history = loadCertificateHistory();
  const currentSnapshot = createCertificatePhaseSnapshot(state.phaseNumber);
  const merged = history.filter((phase) => phase.phaseNumber !== currentSnapshot.phaseNumber);

  if (currentSnapshot.completedSlots > 0) {
    merged.push(currentSnapshot);
  }

  merged.sort((a, b) => a.phaseNumber - b.phaseNumber);

  const phases = [1, 2, 3].map((phaseNumberToFind) => {
    return (
      merged.find((phase) => phase.phaseNumber === phaseNumberToFind) ?? {
        phaseNumber: phaseNumberToFind,
        phaseScore: 0,
        completedDays: 0,
        completedSlots: 0,
        styleLabel: "Chưa hoàn thành",
        days: days.map((day) => ({
          day,
          label: `Ngày ${day}`,
          slots: rows.map((timeLabel) => ({
            timeLabel,
            card: null,
          })),
        })),
        updatedAt: new Date().toISOString(),
      }
    );
  });

  const totalScore = phases.reduce((sum, phase) => sum + phase.phaseScore, 0);
  const completedPhaseCount = phases.filter((phase) => phase.completedSlots > 0).length;
  const completedSlots = phases.reduce((sum, phase) => sum + phase.completedSlots, 0);
  const completedDays = phases.reduce((sum, phase) => sum + phase.completedDays, 0);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    playerName: getDisplayPlayerName(),
    roomId: onlineClientState.roomId ?? "LOCAL",
    totalScore,
    completedPhaseCount,
    completedDays,
    completedSlots,
    phases,
  };
}

export function buildTravelCertificateHtml() {
  const data = getCertificateExportData();
  const safeDataJson = JSON.stringify(data).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Chứng nhận hành trình - ${data.playerName}</title>
  <style>
    :root {
      --ink: #4e3325;
      --muted: rgba(78, 51, 37, 0.68);
      --gold: #d99a2b;
      --gold-dark: #9b641f;
      --paper: #fff7e8;
      --paper-2: #f3e3c6;
      --violet: #7c3aed;
      --green: #4f7d2b;
      --blue: #2563eb;
    }

    * {
      box-sizing: border-box;
      text-rendering: optimizeLegibility;
    }

    html {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at 50% 0%, rgba(255,255,255,.92), transparent 38%),
        linear-gradient(180deg, #efe1c8, #d7bd8d);
      color: var(--ink);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, "Helvetica Neue", sans-serif;
      display: grid;
      place-items: center;
      padding: 22px;
    }

    button {
      font: inherit;
    }

    .certificate {
      width: min(980px, 100%);
      background:
        radial-gradient(circle at 15% 8%, rgba(255,255,255,.9), transparent 26%),
        radial-gradient(circle at 85% 92%, rgba(255,255,255,.55), transparent 30%),
        linear-gradient(180deg, #fff8ea, #f3dfb8);
      border: 3px double rgba(168, 111, 31, .72);
      border-radius: 28px;
      box-shadow:
        0 28px 80px rgba(82, 49, 19, .24),
        inset 0 0 0 10px rgba(255,255,255,.32);
      padding: 34px;
      position: relative;
      overflow: hidden;
    }

    .certificate::before,
    .certificate::after {
      content: "";
      position: absolute;
      width: 360px;
      height: 360px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(217,154,43,.12), transparent 68%);
      pointer-events: none;
    }

    .certificate::before {
      left: -170px;
      top: -170px;
    }

    .certificate::after {
      right: -170px;
      bottom: -170px;
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 4;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-bottom: 12px;
      font-family: system-ui, sans-serif;
    }

    .toolbar button {
      cursor: pointer;
      border: 0;
      border-radius: 999px;
      padding: 10px 14px;
      color: white;
      background: linear-gradient(135deg, #8b5cf6, #6d28d9);
      font-weight: 800;
      box-shadow: 0 10px 18px rgba(109, 40, 217, .22);
    }

    .header {
      position: relative;
      z-index: 1;
      text-align: center;
    }

    .compass {
      width: 54px;
      height: 54px;
      margin: 0 auto 8px;
      display: grid;
      place-items: center;
      border: 2px solid rgba(155, 100, 31, .36);
      border-radius: 50%;
      color: var(--gold-dark);
      font-size: 30px;
      background: rgba(255,255,255,.36);
    }

    .header h1 {
      margin: 0;
      font-family: "Segoe UI", Arial, "Helvetica Neue", sans-serif;
      font-size: clamp(34px, 5vw, 58px);
      font-weight: 900;
      letter-spacing: .02em;
      text-transform: uppercase;
      text-shadow: 0 2px 0 rgba(255,255,255,.65);
    }

    .subtitle {
      margin-top: 8px;
      color: var(--gold-dark);
      font-size: 20px;
    }

    .player {
      margin-top: 22px;
      font-family: "Segoe UI", Arial, "Helvetica Neue", sans-serif;
      font-size: clamp(34px, 4.4vw, 54px);
      font-weight: 900;
      line-height: 1.15;
    }

    .score-panel {
      width: min(620px, 100%);
      margin: 20px auto 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 18px;
      border: 2px solid rgba(188, 129, 48, .52);
      border-radius: 22px;
      padding: 14px 24px;
      background: rgba(255,255,255,.42);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.78), 0 10px 22px rgba(111, 69, 24, .08);
    }

    .score-panel span {
      font-size: 21px;
      font-weight: 800;
    }

    .score-panel strong {
      color: #d97706;
      font-size: clamp(52px, 7vw, 86px);
      line-height: .9;
    }

    .hint {
      margin: 0;
      color: var(--muted);
      font-size: 16px;
    }

    .phase-tabs {
      margin: 28px 0 18px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      position: relative;
      z-index: 1;
    }

    .phase-tab {
      cursor: pointer;
      border: 2px solid rgba(182, 126, 47, .36);
      border-radius: 20px;
      background: rgba(255,255,255,.44);
      padding: 14px;
      color: var(--ink);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.74);
      transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
    }

    .phase-tab:hover,
    .phase-tab.is-active {
      transform: translateY(-2px);
      border-color: rgba(124, 58, 237, .5);
      box-shadow: 0 12px 22px rgba(87, 49, 20, .12), inset 0 1px 0 rgba(255,255,255,.8);
    }

    .phase-tab h2 {
      margin: 0 0 8px;
      color: var(--phase-color);
      font-size: 22px;
    }

    .phase-tab p {
      margin: 6px 0;
      color: var(--muted);
      font-size: 15px;
    }

    .phase-tab strong {
      color: var(--phase-color);
      font-size: 22px;
    }

    .timeline {
      position: relative;
      z-index: 1;
      border: 2px solid rgba(174, 116, 39, .32);
      border-radius: 24px;
      padding: 20px;
      background: rgba(255,255,255,.38);
    }

    .timeline-head {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    .timeline-head h3 {
      margin: 0;
      font-size: 28px;
    }

    .timeline-head span {
      color: var(--muted);
      font-size: 15px;
    }

    .days {
      display: grid;
      gap: 14px;
    }

    .day-card {
      border: 1px solid rgba(174, 116, 39, .28);
      border-radius: 18px;
      background: rgba(255, 251, 239, .78);
      padding: 14px;
    }

    .day-card h4 {
      margin: 0 0 10px;
      color: var(--phase-color);
      font-size: 20px;
    }

    .slots {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
    }

    .slot {
      min-height: 116px;
      border: 1px dashed rgba(160, 115, 66, .46);
      border-radius: 14px;
      padding: 10px;
      background: rgba(255,255,255,.45);
    }

    .slot em {
      display: block;
      color: var(--gold-dark);
      font-style: normal;
      font-weight: 900;
      margin-bottom: 6px;
    }

    .slot strong {
      display: block;
      min-height: 34px;
      font-size: 15px;
      line-height: 1.12;
    }

    .slot span {
      color: #15803d;
      display: block;
      font-weight: 900;
      margin-top: 7px;
    }

    .slot small {
      color: var(--muted);
      display: block;
      margin-top: 4px;
      line-height: 1.25;
    }

    .empty {
      opacity: .58;
    }

    .badges {
      margin-top: 18px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      position: relative;
      z-index: 1;
    }

    .badge {
      border: 1px solid rgba(174, 116, 39, .28);
      border-radius: 999px;
      background: rgba(255,255,255,.42);
      padding: 12px;
      text-align: center;
      color: var(--ink);
      font-weight: 800;
    }

    .footer {
      margin-top: 24px;
      text-align: center;
      color: var(--muted);
      font-size: 15px;
      position: relative;
      z-index: 1;
    }

    .signature {
      display: block;
      margin-top: 6px;
      color: var(--ink);
      font-size: 28px;
      font-style: italic;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .toolbar {
        display: none;
      }

      .certificate {
        box-shadow: none;
        border-radius: 0;
        width: 100%;
      }
    }

    @media (max-width: 760px) {
      .certificate {
        padding: 22px;
      }

      .phase-tabs,
      .badges {
        grid-template-columns: 1fr;
      }

      .slots {
        grid-template-columns: 1fr;
      }

      .score-panel {
        flex-direction: column;
        gap: 4px;
      }
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
      <div class="subtitle">Tổng kết 3 phase</div>
      <div class="player" id="playerName"></div>

      <div class="score-panel">
        <span>TỔNG ĐIỂM</span>
        <strong id="totalScore"></strong>
        <span>VP</span>
      </div>

      <p class="hint">Bấm vào từng phase để xem chi tiết hành trình ngày 1 → 5.</p>
    </section>

    <section class="phase-tabs" id="phaseTabs"></section>

    <section class="timeline" id="timeline"></section>

    <section class="badges">
      <div class="badge">🍽️ Ẩm thực nổi bật</div>
      <div class="badge">📅 Lịch trình hiệu quả</div>
      <div class="badge">🏔️ Khám phá bền bỉ</div>
      <div class="badge">🏆 Hoàn thành 3 phase</div>
    </section>

    <footer class="footer">
      <div id="exportDate"></div>
      <span class="signature">Travel Board Online</span>
    </footer>
  </main>

  <script>
    const certificateData = ${safeDataJson};
    let activePhaseNumber = certificateData.phases.find((phase) => phase.completedSlots > 0)?.phaseNumber ?? 1;

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function getPhaseColor(phaseNumber) {
      if (phaseNumber === 1) return "#4f7d2b";
      if (phaseNumber === 2) return "#2563eb";
      return "#7c3aed";
    }

    function renderPhaseTabs() {
      const root = document.querySelector("#phaseTabs");

      root.innerHTML = certificateData.phases.map((phase) => {
        const isActive = phase.phaseNumber === activePhaseNumber;
        const color = getPhaseColor(phase.phaseNumber);

        return \`
          <button class="phase-tab \${isActive ? "is-active" : ""}" style="--phase-color: \${color}" onclick="selectPhase(\${phase.phaseNumber})">
            <h2>PHASE \${phase.phaseNumber}</h2>
            <p>Điểm: <strong>\${phase.phaseScore} VP</strong></p>
            <p>Ngày hoàn thành: \${phase.completedDays}/5</p>
            <p>Phong cách: \${escapeHtml(phase.styleLabel)}</p>
          </button>
        \`;
      }).join("");
    }

    function renderTimeline() {
      const phase = certificateData.phases.find((item) => item.phaseNumber === activePhaseNumber) ?? certificateData.phases[0];
      const root = document.querySelector("#timeline");
      const color = getPhaseColor(phase.phaseNumber);

      root.style.setProperty("--phase-color", color);

      root.innerHTML = \`
        <div class="timeline-head">
          <div>
            <h3>Chi tiết Phase \${phase.phaseNumber}</h3>
            <span>\${phase.completedSlots} slot • \${phase.completedDays}/5 ngày • \${phase.phaseScore} VP</span>
          </div>
        </div>

        <div class="days">
          \${phase.days.map((day) => {
            const hasAnyCard = day.slots.some((slot) => slot.card);

            return \`
              <article class="day-card \${hasAnyCard ? "" : "empty"}">
                <h4>\${escapeHtml(day.label)}</h4>
                <div class="slots">
                  \${day.slots.map((slot) => {
                    if (!slot.card) {
                      return \`
                        <div class="slot empty">
                          <em>\${escapeHtml(slot.timeLabel)}</em>
                          <strong>Nghỉ / Di chuyển</strong>
                          <small>Chưa có hoạt động</small>
                        </div>
                      \`;
                    }

                    return \`
                      <div class="slot">
                        <em>\${escapeHtml(slot.timeLabel)}</em>
                        <strong>\${escapeHtml(slot.card.name)}</strong>
                        <small>\${escapeHtml(slot.card.city || "Không rõ khu vực")}</small>
                        <span>+\${slot.card.vp} VP</span>
                        <small>\${escapeHtml(slot.card.tagLabel || slot.card.tag)}</small>
                      </div>
                    \`;
                  }).join("")}
                </div>
              </article>
            \`;
          }).join("")}
        </div>
      \`;
    }

    function selectPhase(phaseNumber) {
      activePhaseNumber = phaseNumber;
      renderPhaseTabs();
      renderTimeline();
    }

    document.querySelector("#playerName").textContent = certificateData.playerName;
    document.querySelector("#totalScore").textContent = certificateData.totalScore;
    document.querySelector("#exportDate").textContent = "Ngày xuất: " + new Date(certificateData.exportedAt).toLocaleDateString("vi-VN");
    renderPhaseTabs();
    renderTimeline();
  </script>
</body>
</html>`;
}

export function downloadTravelCertificateHtml() {
  const data = getCertificateExportData();
  const baseName = getExportFileSafeName(
    `${data.playerName}-chung-nhan-hanh-trinh-3-phase`
  );

  downloadTextFile(
    `${baseName}.html`,
    buildTravelCertificateHtml(),
    "text/html;charset=utf-8"
  );
}

export function formatTravelTimelineAsText() {
  const data = buildTravelTimelineExport();
  const lines: string[] = [];

  lines.push("LỮ KHÁCH BÀN CỜ - LỊCH TRÌNH DU LỊCH");
  lines.push(`Người chơi: ${data.playerName}`);
  lines.push(`Phase: ${data.phaseNumber}`);
  lines.push(`Ngày xuất: ${new Date(data.createdAt).toLocaleString("vi-VN")}`);
  lines.push("");
  lines.push("TỔNG KẾT");
  lines.push(`- Điểm ngày: ${data.score.totalVP} VP`);
  lines.push(`- Tổng phase hiện tại: ${data.score.accumulatedVP} VP`);
  lines.push(`- Xu đã dùng: ${data.resources.spentCoin}`);
  lines.push(`- Thể lực đã dùng: ${data.resources.spentStamina}`);
  lines.push(`- Slot đã dùng: ${data.resources.usedSlots}/25`);
  lines.push("");

  for (const day of data.timeline) {
    const hasAnyCard = day.slots.some((slot) => slot.card !== null);

    if (!hasAnyCard) continue;

    lines.push(day.label.toUpperCase());

    for (const slot of day.slots) {
      if (!slot.card) {
        lines.push(`- ${slot.timeLabel}: Nghỉ / Di chuyển`);
        continue;
      }

      lines.push(
        `- ${slot.timeLabel}: ${slot.card.name} (${slot.card.city || "Không rõ khu vực"})`
      );
      lines.push(
        `  Tag: ${slot.card.tagLabel || slot.card.tag} • VP: ${slot.card.vp} • Xu: ${slot.card.coin} • Thể lực: ${slot.card.stamina}`
      );

      if (slot.card.description) {
        lines.push(`  Ghi chú: ${slot.card.description}`);
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
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

export function downloadTravelTimeline(format: "txt" | "json") {
  const data = buildTravelTimelineExport();
  const baseName = getExportFileSafeName(
    `${data.playerName}-phase-${data.phaseNumber}-lich-trinh`
  );

  if (format === "json") {
    downloadTextFile(
      `${baseName}.json`,
      JSON.stringify(data, null, 2),
      "application/json;charset=utf-8"
    );
    return;
  }

  downloadTextFile(
    `${baseName}.txt`,
    formatTravelTimelineAsText(),
    "text/plain;charset=utf-8"
  );
}

export async function copyTravelTimelineToClipboard() {
  const text = formatTravelTimelineAsText();

  try {
    await navigator.clipboard.writeText(text);
    alert("Đã copy lịch trình vào clipboard.");
  } catch {
    prompt("Copy lịch trình:", text);
  }
}


