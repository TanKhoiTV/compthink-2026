export function getDraftPlayerNames() {
    return ["Cường", "An", "Minh", "Khánh"];
}
export function getActiveDraftPlayerIndex() {
    return 1; // An
}
export function getCurrentDraftPlayer(draftPlayers, activeIndex = getActiveDraftPlayerIndex()) {
    return draftPlayers[activeIndex];
}
export function pickRandomCard(cards) {
    if (cards.length === 0)
        return null;
    const randomIndex = Math.floor(Math.random() * cards.length);
    return cards[randomIndex];
}
export function rotateDraftPoolsClockwise(draftPlayers) {
    const oldPools = draftPlayers.map((player) => [...player.pool]);
    return draftPlayers.map((player, index) => {
        const sourceIndex = (index - 1 + draftPlayers.length) % draftPlayers.length;
        return Object.assign(Object.assign({}, player), { pool: oldPools[sourceIndex] });
    });
}
function getPrimaryDraftTag(card) {
    var _a, _b, _c, _d;
    const rawId = String((_b = (_a = card.id) !== null && _a !== void 0 ? _a : card.card_id) !== null && _b !== void 0 ? _b : "").toUpperCase();
    if (rawId.includes("_CULT_") || rawId.startsWith("SG_CULT"))
        return "CULTURE";
    if (rawId.includes("_ACT_") || rawId.startsWith("SG_ACT"))
        return "ACTION";
    if (rawId.includes("_UTIL_") || rawId.startsWith("SG_UTIL"))
        return "UTILITY";
    if (rawId.includes("_FOOD_") || rawId.startsWith("SG_FOOD"))
        return "FOOD";
    const tags = ((_c = card.tags) !== null && _c !== void 0 ? _c : []).map((tag) => String(tag).toUpperCase());
    if (tags.includes("CULTURE"))
        return "CULTURE";
    if (tags.includes("ACTION"))
        return "ACTION";
    if (tags.includes("UTILITY"))
        return "UTILITY";
    if (tags.includes("FOOD"))
        return "FOOD";
    const fallbackTag = String((_d = card.tag) !== null && _d !== void 0 ? _d : "").toUpperCase();
    if (fallbackTag === "CULTURE")
        return "CULTURE";
    if (fallbackTag === "ACTION")
        return "ACTION";
    if (fallbackTag === "UTILITY")
        return "UTILITY";
    if (fallbackTag === "FOOD")
        return "FOOD";
    return "UNKNOWN";
}
function shuffleGeneric(items) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        const temp = shuffled[index];
        shuffled[index] = shuffled[randomIndex];
        shuffled[randomIndex] = temp;
    }
    return shuffled;
}
function createBalancedRandomDeck(cards, shuffleCards) {
    var _a, _b;
    const buckets = new Map();
    for (const card of cards) {
        const tag = getPrimaryDraftTag(card);
        const bucket = (_a = buckets.get(tag)) !== null && _a !== void 0 ? _a : [];
        bucket.push(card);
        buckets.set(tag, bucket);
    }
    for (const [tag, bucket] of buckets.entries()) {
        buckets.set(tag, shuffleCards(bucket));
    }
    const balancedDeck = [];
    const preferredOrder = ["FOOD", "CULTURE", "ACTION", "UTILITY", "UNKNOWN"];
    while (preferredOrder.some((tag) => { var _a, _b; return ((_b = (_a = buckets.get(tag)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0; })) {
        const roundOrder = shuffleGeneric(preferredOrder);
        for (const tag of roundOrder) {
            const nextCard = (_b = buckets.get(tag)) === null || _b === void 0 ? void 0 : _b.shift();
            if (nextCard) {
                balancedDeck.push(nextCard);
            }
        }
    }
    return balancedDeck;
}
export function createDailyDraftPlayers({ deck, handSize, playerCount, shuffleCards, }) {
    /*
      Không tự bơm lại initialDeck nữa.
  
      Bản cũ làm thế này khi deck không đủ bài:
        shuffleCards([...deck, ...initialDeck])
  
      Điều đó khiến các thẻ đã dùng lại xuất hiện như "bản copy/fake".
      Bản này chỉ chia đúng số thẻ thật còn lại trong deck.
      Nếu deck gần hết, một vài pool sẽ ít hơn handSize thay vì tạo bản sao.
    */
    const requiredCards = playerCount * handSize;
    const draftDeck = createBalancedRandomDeck(deck, shuffleCards);
    const dailyCards = draftDeck.slice(0, Math.min(requiredCards, draftDeck.length));
    const nextDeck = draftDeck.slice(dailyCards.length);
    const names = getDraftPlayerNames();
    return {
        deck: nextDeck,
        draftPlayers: names.map((name, index) => {
            const start = index * handSize;
            return {
                name,
                pool: dailyCards.slice(start, start + handSize),
                picked: [],
            };
        }),
    };
}
