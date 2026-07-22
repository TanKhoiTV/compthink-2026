/*
  Màn "kết quả cuối" bịa cho tour — hiện khi người chơi bấm skip sau vài ngày.

  Lấy điểm THẬT hiện tại của 4 người chơi rồi CHIẾU (project) lên đủ 5 ngày để
  ra bảng xếp hạng cuối hợp lý, reveal lần lượt, rồi cho về trang chủ.
*/

export type TourPlayer = {
  name: string;
  score: number;
  isBot: boolean;
  isSelf: boolean;
};

/** Chiếu điểm hiện tại (sau daysPlayed ngày) lên đủ 5 ngày, thêm chút ngẫu nhiên nhẹ. */
function projectFinal(score: number, daysPlayed: number): number {
  const played = Math.max(1, daysPlayed);
  const base = (score * 5) / played;
  const jitter = 0.92 + ((score % 7) / 7) * 0.16; // 0.92–1.08, tất định theo score
  return Math.round(base * jitter);
}

function medal(rank: number): string {
  return ["🥇", "🥈", "🥉", "4️⃣"][rank] ?? `${rank + 1}`;
}

function esc(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Hiện màn kết quả cuối (overlay tự chứa). onClose gọi khi bấm "Về trang chủ".
 */
export function showResultsReveal(
  players: TourPlayer[],
  daysPlayed: number,
  onClose: () => void
): void {
  const ranked = players
    .map((p) => ({ ...p, final: projectFinal(p.score, daysPlayed) }))
    .sort((a, b) => b.final - a.final);

  const self = ranked.find((p) => p.isSelf);
  const selfRank = ranked.findIndex((p) => p.isSelf);

  const layer = document.createElement("div");
  layer.className = "tour-result-layer";
  layer.innerHTML = `
    <div class="tour-result">
      <p class="tour-result__eyebrow">Tổng kết hành trình (mô phỏng)</p>
      <h2 class="tour-result__title">Kết quả 5 ngày</h2>
      <ol class="tour-result__board">
        ${ranked
          .map(
            (p, i) => `
          <li class="tour-result__row ${p.isSelf ? "is-self" : ""}" style="--i:${i}">
            <span class="tour-result__medal">${medal(i)}</span>
            <span class="tour-result__name">${esc(p.name)}${p.isBot ? " 🤖" : ""}${p.isSelf ? " (Bạn)" : ""}</span>
            <span class="tour-result__score">${p.final} <small>VP</small></span>
          </li>`,
          )
          .join("")}
      </ol>
      <p class="tour-result__verdict">
        ${
          selfRank === 0
            ? "🎉 Bạn dẫn đầu hành trình! Tuyệt vời."
            : `Bạn xếp hạng ${selfRank + 1}/4 với ${self?.final ?? 0} VP. Chơi thật để leo top nhé!`
        }
      </p>
      <button type="button" class="tour-result__home" data-result-home>Về trang chủ</button>
    </div>
  `;
  document.body.appendChild(layer);
  document.body.classList.add("tour-result-open");

  // reveal animation trigger
  requestAnimationFrame(() => layer.classList.add("is-in"));

  const close = () => {
    layer.remove();
    document.body.classList.remove("tour-result-open");
    onClose();
  };
  layer.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("[data-result-home]")) {
      e.preventDefault();
      close();
    }
  });
}
