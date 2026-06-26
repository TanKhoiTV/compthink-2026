import type { PlayerId, PublicBoardCell, RoomState, ServerTravelCardData } from "./types.js";
import { phase1Cards } from "../src/data/cards.phase1.js";
import { mapGameCardToTravelCard } from "../src/data/cardMapper.js";


type ServerCardEffect = {
  has_effect: boolean;
  effect_type: string;
  effect_value: number;
};

export type ServerCardWithEffect = ServerTravelCardData & {
  onPlayEffect?: ServerCardEffect;
};

export const PLAYER_IDS: PlayerId[] = ["p1", "p2", "p3", "p4"];

export function createEmptyBoard(): PublicBoardCell[][] {
  return Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => null));
}

export function createRoomId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function shuffleCards<T>(cards: T[]): T[] {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temp = shuffled[index];
    shuffled[index] = shuffled[randomIndex];
    shuffled[randomIndex] = temp;
  }

  return shuffled;
}

/*
  Snapshot cũ chỉ giữ lại tạm thời để đối chiếu dữ liệu khi migrate.
  Deck online thực tế bên dưới được tạo từ src/data/cards.phase1.ts.
*/
const LEGACY_SERVER_CARDS: ServerCardWithEffect[] = [
  {
    "id": "SG_FOOD_001",
    "name": "Cà Phê Bệt Nhà Thờ Đức Bà",
    "shortName": "Cà Phê Bệt Nhà Thờ Đức Bà",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_001.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 5,
    "coin": 1,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "OUTDOOR"
    ],
    "icon": "☕",
    "description": "Trải nghiệm vỉa hè chuẩn Sài Gòn. Thức uống siêu rẻ nhưng bạn phải đánh cược với thời tiết nắng mưa bất chợt.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_002",
    "name": "Ăn Vặt Hồ Con Rùa",
    "shortName": "Ăn Vặt Hồ Con Rùa",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_002.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 5,
    "coin": 1,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "OUTDOOR"
    ],
    "icon": "🍽️",
    "description": "Tụ điểm hóng gió lý tưởng nhưng khói bụi giao thông là điều không thể tránh khỏi.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_003",
    "name": "Cà Phê Vợt Cheo Leo",
    "shortName": "Cà Phê Vợt Cheo Leo",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_003.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 8,
    "coin": 1,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "INDOOR"
    ],
    "icon": "☕",
    "description": "Hương vị thời gian đọng lại trong quán cà phê vợt lâu đời nhất thành phố. Yên bình, rẻ và an toàn tuyệt đối.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_004",
    "name": "Phá Lấu Bò Cô Oanh (Quận 4)",
    "shortName": "Phá Lấu Bò Cô Oanh (Quận 4)",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_004.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 5,
    "coin": 1,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "OUTDOOR"
    ],
    "icon": "🍜",
    "description": "Chén phá lấu đỏ au, thơm lừng nước cốt dừa ăn kèm bánh mì nóng giòn. Ngồi ghế súp vỉa hè ngắm xe cộ qua lại đúng chất dân chơi Quận 4.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_005",
    "name": "Súp Cua Chợ Tân Định",
    "shortName": "Súp Cua Chợ Tân Định",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_005.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 5,
    "coin": 1,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "OUTDOOR"
    ],
    "icon": "🍜",
    "description": "Chén súp nóng hổi, đặc ruột cạnh ngôi chợ hồng biểu tượng. Cứu đói nhanh gọn cho hành trình dài.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_006",
    "name": "Bánh Mì Huỳnh Hoa",
    "shortName": "Bánh Mì Huỳnh Hoa",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_006.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 10,
    "coin": 2,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "OUTDOOR"
    ],
    "icon": "🥖",
    "description": "Ổ bánh mì nặng trịch pate, ăn một nửa cũng đủ no. Đổi lại, bạn phải kiên nhẫn xếp hàng mua mang đi.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_007",
    "name": "Phố Ẩm Thực Hồ Thị Kỷ",
    "shortName": "Phố Ẩm Thực Hồ Thị Kỷ",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_007.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 15,
    "coin": 2,
    "stamina": 1,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "OUTDOOR"
    ],
    "icon": "🍽️",
    "description": "Thiên đường ăn vặt và mùi hoa tươi đan xen. Ăn no căng bụng nhưng rã rời đôi chân vì chen lấn.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_008",
    "name": "Cà Phê Chung Cư 42 Nguyễn Huệ",
    "shortName": "Cà Phê Chung Cư 42 Nguyễn Huệ",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_008.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 12,
    "coin": 2,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "INDOOR"
    ],
    "icon": "☕",
    "description": "Trạm nghỉ chân hoài cổ nhìn ra phố đi bộ hiện đại. Nơi trú mưa hoàn hảo giữa lịch trình cạn kiệt.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_009",
    "name": "Phố Sủi Cảo Hà Tôn Quyền",
    "shortName": "Phố Sủi Cảo Hà Tôn Quyền",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_009.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 12,
    "coin": 2,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "OUTDOOR"
    ],
    "icon": "🍽️",
    "description": "Tiếng gọi món rôm rả cả góc phố người Hoa. Nằm xa trung tâm nên hãy cẩn thận bẫy khoảng cách di chuyển.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_010",
    "name": "Cơm Tấm Ba Ghiền",
    "shortName": "Cơm Tấm Ba Ghiền",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_010.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 15,
    "coin": 2,
    "stamina": 1,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "INDOOR"
    ],
    "icon": "🍽️",
    "description": "Miếng sườn nướng than to bằng cái đĩa. Trải nghiệm no nê.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_011",
    "name": "Phố Ốc Vĩnh Khánh",
    "shortName": "Phố Ốc Vĩnh Khánh",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_011.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 12,
    "coin": 2,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "OUTDOOR"
    ],
    "icon": "🍽️",
    "description": "Mùi bơ tỏi và mỡ hành nức mũi. Đại diện xuất sắc nhất cho văn hóa ăn ốc của giới trẻ thành phố.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_012",
    "name": "Bánh Xèo Đinh Công Tráng",
    "shortName": "Bánh Xèo Đinh Công Tráng",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_012.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 10,
    "coin": 2,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "INDOOR"
    ],
    "icon": "🍽️",
    "description": "Tiệm bánh xèo miền Nam truyền thống ẩn trong hẻm. Vừa giòn.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_013",
    "name": "Chè Hà Ký Chợ Lớn",
    "shortName": "Chè Hà Ký Chợ Lớn",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_013.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 10,
    "coin": 2,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "INDOOR"
    ],
    "icon": "🍽️",
    "description": "Chè trứng gà trà, chè mè đen trứ danh. Điểm chốt ngọt ngào sau chuyến khám phá văn hóa phố Tàu.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_014",
    "name": "Phở Hòa Pasteur",
    "shortName": "Phở Hòa Pasteur",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_014.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 15,
    "coin": 3,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "INDOOR"
    ],
    "icon": "🍜",
    "description": "Biểu tượng Phở miền Nam nổi tiếng với khách quốc tế. Không gian lịch sự, giá cao nhưng trải nghiệm tròn trịa.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_015",
    "name": "Lẩu Cá Kèo Bà Huyện Thanh Quan",
    "shortName": "Lẩu Cá Kèo Bà Huyện Thanh Quan",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_015.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 18,
    "coin": 3,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "INDOOR"
    ],
    "icon": "🍜",
    "description": "Nồi lẩu chua lá giang sôi sùng sục cùng cá kèo tươi rói. Biểu tượng nhậu lai rai cực kỳ bén mồi của người miền Nam.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_016",
    "name": "Quán Bụi - Hương Vị Quê Nhà",
    "shortName": "Quán Bụi - Hương Vị Quê Nhà",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_016.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 18,
    "coin": 3,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "INDOOR"
    ],
    "icon": "🍽️",
    "description": "Những món ăn thuần Việt được nâng tầm tinh tế. Không gian hoài cổ với chén sành, đũa tre, mang lại lượng điểm ổn định giữa lòng Quận 1.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_017",
    "name": "Dimsum Tiến Phát",
    "shortName": "Dimsum Tiến Phát",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_017.png",
    "rarity": "uncommon",
    "rarityLabel": "★★★",
    "vp": 25,
    "coin": 4,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "INDOOR"
    ],
    "icon": "🍽️",
    "description": "Bữa sáng xa xỉ kiểu Quảng Đông. Đánh đổi số tiền lớn để thu về lượng điểm khổng lồ ngay từ lúc bình minh.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_018",
    "name": "Nhà Hàng Chay Hum",
    "shortName": "Nhà Hàng Chay Hum",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_018.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 15,
    "coin": 4,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "INDOOR"
    ],
    "icon": "🍽️",
    "description": "Không gian thiền tịnh, thức ăn thanh lọc. Mọi muộn phiền tan biến, cơ thể bạn được hồi phục sinh lực hoàn toàn.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_019",
    "name": "Ăn Tối Du Thuyền Sông Sài Gòn",
    "shortName": "Ăn Tối Du Thuyền Sông Sài Gòn",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_019.png",
    "rarity": "epic",
    "rarityLabel": "★★★★",
    "vp": 35,
    "coin": 5,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "ACTION"
    ],
    "icon": "🍽️",
    "description": "Thưởng thức bít tết và rượu vang trôi dọc dòng sông rực sáng ánh đèn. Trải nghiệm đắt đỏ nhưng xứng đáng từng đồng.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_020",
    "name": "Harpers-Bazaar Tầng 79 Landmark 81",
    "shortName": "Harpers-Bazaar Tầng 79 Landmark 81",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_020.png",
    "rarity": "epic",
    "rarityLabel": "★★★★",
    "vp": 45,
    "coin": 6,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "INDOOR"
    ],
    "icon": "🍽️",
    "description": "Bữa ăn trên đỉnh bầu trời Sài Gòn. Bạn đốt ngót nghét 60% ngân sách khởi điểm để giáng đòn chí mạng về điểm số.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_021",
    "name": "Cơm Quê Dượng Bầu",
    "shortName": "Cơm Quê Dượng Bầu",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_021.png",
    "rarity": "epic",
    "rarityLabel": "★★★★",
    "vp": 35,
    "coin": 5,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "INDOOR"
    ],
    "icon": "🍽️",
    "description": "Mâm cơm quê mộc mạc với trứng chiên, canh chua nhưng được phục vụ trong không gian sang trọng bậc nhất. Trải nghiệm tìm về tuổi thơ nhưng với một cái giá của người trưởng thành.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_022",
    "name": "Ly Dừa Tắc Pasteur",
    "shortName": "Ly Dừa Tắc Pasteur",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_022.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 5,
    "coin": 1,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "OUTDOOR"
    ],
    "icon": "🍽️",
    "description": "Thức uống giải nhiệt huyền thoại dưới những tán cây cổ thụ. Rẻ, mát lạnh nhưng bạn phải đứng uống giữa khói bụi dòng xe qua lại.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_023",
    "name": "Bột Chiên Đạt Thành",
    "shortName": "Bột Chiên Đạt Thành",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_023.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 8,
    "coin": 1,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "INDOOR"
    ],
    "icon": "🍽️",
    "description": "Đĩa bột chiên giòn rụm với trứng và đu đủ ngâm chua. Nằm sâu trong khu người Hoa, giá rẻ và an toàn tuyệt đối khỏi những cơn mưa.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_024",
    "name": "Xôi Mặn Bùi Thị Xuân",
    "shortName": "Xôi Mặn Bùi Thị Xuân",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_024.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 5,
    "coin": 1,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "OUTDOOR"
    ],
    "icon": "🍽️",
    "description": "Gói xôi thập cẩm bọc lá chuối chắc nịch đầy lạp xưởng và chà bông. Bữa sáng quốc dân cung cấp năng lượng tức thì để bắt đầu ngày mới.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_025",
    "name": "Lẩu Bò Tí Chuột",
    "shortName": "Lẩu Bò Tí Chuột",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_025.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 12,
    "coin": 2,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "OUTDOOR"
    ],
    "icon": "🍜",
    "description": "Nồi lẩu khói nghi ngút bên vỉa hè sầm uất. Ngon rẻ và rất dễ để tụ tập nối Combo với bạn bè vào buổi tối muộn.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_026",
    "name": "Bún Thịt Nướng Kiều Bảo",
    "shortName": "Bún Thịt Nướng Kiều Bảo",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_026.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 10,
    "coin": 2,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "INDOOR"
    ],
    "icon": "🍽️",
    "description": "Hương vị thịt nướng sả ướp đậm đà lan tỏa cả góc phố. Một lựa chọn cực kỳ chắc bụng, miễn nhiễm với thời tiết xấu.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_027",
    "name": "Ốc Như Điện Biên Phủ",
    "shortName": "Ốc Như Điện Biên Phủ",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_027.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 15,
    "coin": 2,
    "stamina": 1,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "INDOOR"
    ],
    "icon": "🍽️",
    "description": "Một trong những tiệm ốc chất lượng nhất. Bạn được ăn ngon, an toàn nhưng phải chầu chực xếp hàng lấy số đến mức hao mòn thể lực.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_028",
    "name": "Tàu Hũ Đá Xe Lam",
    "shortName": "Tàu Hũ Đá Xe Lam",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_028.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 10,
    "coin": 2,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "INDOOR"
    ],
    "icon": "🍽️",
    "description": "Chén tàu hũ truyền thống kết hợp topping hiện đại. Khuất bóng ở khu phố ẩm thực sầm uất, là trạm nghỉ chân ngọt ngào và mát lạnh.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_029",
    "name": "Lẩu Cua Đất Mũi",
    "shortName": "Lẩu Cua Đất Mũi",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_029.png",
    "rarity": "uncommon",
    "rarityLabel": "★★★",
    "vp": 22,
    "coin": 4,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "INDOOR"
    ],
    "icon": "🍜",
    "description": "Thưởng thức cua Cà Mau chắc thịt trong không gian máy lạnh. Tốn kém nhưng lại mang đến lượng VP khổng lồ vô cùng an toàn.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_FOOD_030",
    "name": "Noir. Dining in the Dark",
    "shortName": "Noir. Dining in the Dark",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_food_030.png",
    "rarity": "epic",
    "rarityLabel": "★★★★",
    "vp": 35,
    "coin": 5,
    "stamina": 0,
    "tag": "food",
    "tagLabel": "Ẩm thực",
    "tags": [
      "FOOD",
      "INDOOR"
    ],
    "icon": "🍽️",
    "description": "Bữa ăn tuyệt mật hoàn toàn trong bóng tối, được phục vụ bởi người khiếm thị. Trải nghiệm ẩm thực thức tỉnh mọi giác quan khiến tâm trí bạn kiệt sức nhưng ấn tượng sâu sắc.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": true,
      "effect_type": "DEDUCT_LA",
      "effect_value": 1
    }
  },
  {
    "id": "SG_UTIL_001",
    "name": "Trụ ATM",
    "shortName": "Trụ ATM",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_util_001.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 0,
    "coin": 0,
    "stamina": 1,
    "tag": "utility",
    "tagLabel": "Tiện ích",
    "tags": [
      "UTILITY",
      "INDOOR"
    ],
    "icon": "🏧",
    "description": "Ngân sách cạn kiệt, bạn rảo bộ tìm bốt ATM để tiếp tế đạn dược. Mỏi chân đôi chút nhưng ví tiền lại rủng rỉnh.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": true,
      "effect_type": "RECOVER_XU",
      "effect_value": 2
    }
  },
  {
    "id": "SG_UTIL_002",
    "name": "Trụ ATM",
    "shortName": "Trụ ATM",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_util_001.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 0,
    "coin": 0,
    "stamina": 1,
    "tag": "utility",
    "tagLabel": "Tiện ích",
    "tags": [
      "UTILITY",
      "INDOOR"
    ],
    "icon": "🏧",
    "description": "Ngân sách cạn kiệt, bạn rảo bộ tìm bốt ATM để tiếp tế đạn dược. Mỏi chân đôi chút nhưng ví tiền lại rủng rỉnh.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": true,
      "effect_type": "RECOVER_XU",
      "effect_value": 2
    }
  },
  {
    "id": "SG_UTIL_003",
    "name": "Voucher Xe Công Nghệ",
    "shortName": "Voucher Xe Công Nghệ",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_util_003.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 0,
    "coin": 1,
    "stamina": 0,
    "tag": "utility",
    "tagLabel": "Tiện ích",
    "tags": [
      "UTILITY",
      "INDOOR"
    ],
    "icon": "🛵",
    "description": "Chớp được mã gọi xe giá hời trên ứng dụng. Ngồi ô tô máy lạnh cho phép bạn nhảy cóc đến bất cứ đâu mà không lo mỏi chân.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": true,
      "effect_type": "IGNORE_DISTANCE_NEXT",
      "effect_value": 1
    }
  },
  {
    "id": "SG_UTIL_004",
    "name": "Voucher Xe Công Nghệ",
    "shortName": "Voucher Xe Công Nghệ",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_util_003.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 0,
    "coin": 1,
    "stamina": 0,
    "tag": "utility",
    "tagLabel": "Tiện ích",
    "tags": [
      "UTILITY",
      "INDOOR"
    ],
    "icon": "🛵",
    "description": "Chớp được mã gọi xe giá hời trên ứng dụng. Ngồi ô tô máy lạnh cho phép bạn nhảy cóc đến bất cứ đâu mà không lo mỏi chân.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": true,
      "effect_type": "IGNORE_DISTANCE_NEXT",
      "effect_value": 1
    }
  },
  {
    "id": "SG_UTIL_005",
    "name": "Voucher Giảm Giá",
    "shortName": "Voucher Giảm Giá",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_util_005.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 0,
    "coin": 0,
    "stamina": 0,
    "tag": "utility",
    "tagLabel": "Tiện ích",
    "tags": [
      "UTILITY",
      "INDOOR",
      "OUTDOOR"
    ],
    "icon": "🎟️",
    "description": "Thu thập được một mã khuyến mãi chớp nhoáng. Thẻ này sẽ giúp bạn giảm đáng kể chi phí cho hoạt động đắt đỏ tiếp theo.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": true,
      "effect_type": "DISCOUNT_XU_NEXT",
      "effect_value": 2
    }
  },
  {
    "id": "SG_UTIL_006",
    "name": "Voucher Giảm Giá",
    "shortName": "Voucher Giảm Giá",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_util_005.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 0,
    "coin": 0,
    "stamina": 0,
    "tag": "utility",
    "tagLabel": "Tiện ích",
    "tags": [
      "UTILITY",
      "INDOOR",
      "OUTDOOR"
    ],
    "icon": "🎟️",
    "description": "Thu thập được một mã khuyến mãi chớp nhoáng. Thẻ này sẽ giúp bạn giảm đáng kể chi phí cho hoạt động đắt đỏ tiếp theo.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": true,
      "effect_type": "DISCOUNT_XU_NEXT",
      "effect_value": 2
    }
  },
  {
    "id": "SG_UTIL_007",
    "name": "Xe Đạp Công Cộng",
    "shortName": "Xe Đạp Công Cộng",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_util_007.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 0,
    "coin": 0,
    "stamina": 2,
    "tag": "utility",
    "tagLabel": "Tiện ích",
    "tags": [
      "UTILITY",
      "OUTDOOR"
    ],
    "icon": "🛵",
    "description": "Quét mã thuê một chiếc xe đạp để băng qua dòng xe kẹt cứng. Né được thuật toán trừ điểm khoảng cách nhưng bạn sẽ toát mồ hôi hột.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": true,
      "effect_type": "IGNORE_DISTANCE_NEXT",
      "effect_value": 1
    }
  },
  {
    "id": "SG_UTIL_008",
    "name": "Xe Đạp Công Cộng",
    "shortName": "Xe Đạp Công Cộng",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_util_007.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 0,
    "coin": 0,
    "stamina": 2,
    "tag": "utility",
    "tagLabel": "Tiện ích",
    "tags": [
      "UTILITY",
      "OUTDOOR"
    ],
    "icon": "🛵",
    "description": "Quét mã thuê một chiếc xe đạp để băng qua dòng xe kẹt cứng. Né được thuật toán trừ điểm khoảng cách nhưng bạn sẽ toát mồ hôi hột.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": true,
      "effect_type": "IGNORE_DISTANCE_NEXT",
      "effect_value": 1
    }
  },
  {
    "id": "SG_UTIL_009",
    "name": "Tiệm Massage Chân",
    "shortName": "Tiệm Massage Chân",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_util_009.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 0,
    "coin": 2,
    "stamina": 0,
    "tag": "utility",
    "tagLabel": "Tiện ích",
    "tags": [
      "UTILITY",
      "INDOOR"
    ],
    "icon": "🧰",
    "description": "Ngâm chân thảo mộc và ấn huyệt chuyên sâu. Một khoản đầu tư xứng đáng để đôi chân được hồi sinh sau chuỗi ngày cuốc bộ rã rời.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": true,
      "effect_type": "RECOVER_LA",
      "effect_value": 3
    }
  },
  {
    "id": "SG_UTIL_010",
    "name": "Tiệm Massage Chân",
    "shortName": "Tiệm Massage Chân",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_util_009.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 0,
    "coin": 2,
    "stamina": 0,
    "tag": "utility",
    "tagLabel": "Tiện ích",
    "tags": [
      "UTILITY",
      "INDOOR"
    ],
    "icon": "🧰",
    "description": "Ngâm chân thảo mộc và ấn huyệt chuyên sâu. Một khoản đầu tư xứng đáng để đôi chân được hồi sinh sau chuỗi ngày cuốc bộ rã rời.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": true,
      "effect_type": "RECOVER_LA",
      "effect_value": 3
    }
  },
  {
    "id": "SG_UTIL_011",
    "name": "Cửa Hàng Tiện Lợi 24/7",
    "shortName": "Cửa Hàng Tiện Lợi 24/7",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_util_011.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 0,
    "coin": 0,
    "stamina": 0,
    "tag": "utility",
    "tagLabel": "Tiện ích",
    "tags": [
      "UTILITY",
      "INDOOR"
    ],
    "icon": "🧰",
    "description": "Đẩy cửa bước vào, luồng khí lạnh phả vào mặt lập tức xua tan cái nóng. Mua tạm chai nước suối và đứng hưởng sái điều hòa.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": true,
      "effect_type": "RECOVER_LA",
      "effect_value": 1
    }
  },
  {
    "id": "SG_UTIL_012",
    "name": "Cửa Hàng Tiện Lợi 24/7",
    "shortName": "Cửa Hàng Tiện Lợi 24/7",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_util_011.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 0,
    "coin": 0,
    "stamina": 0,
    "tag": "utility",
    "tagLabel": "Tiện ích",
    "tags": [
      "UTILITY",
      "INDOOR"
    ],
    "icon": "🧰",
    "description": "Đẩy cửa bước vào, luồng khí lạnh phả vào mặt lập tức xua tan cái nóng. Mua tạm chai nước suối và đứng hưởng sái điều hòa.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": true,
      "effect_type": "RECOVER_LA",
      "effect_value": 1
    }
  },
  {
    "id": "SG_UTIL_013",
    "name": "Tiệm Gội Đầu Dưỡng Sinh",
    "shortName": "Tiệm Gội Đầu Dưỡng Sinh",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_util_013.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 0,
    "coin": 1,
    "stamina": 0,
    "tag": "utility",
    "tagLabel": "Tiện ích",
    "tags": [
      "UTILITY",
      "INDOOR"
    ],
    "icon": "🧰",
    "description": "Đắm chìm trong hương sả chanh và những động tác xoa bóp điêu luyện. Trải nghiệm thư giãn đặc sản này giúp bạn rũ bỏ mọi mệt mỏi.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": true,
      "effect_type": "RECOVER_LA",
      "effect_value": 2
    }
  },
  {
    "id": "SG_UTIL_014",
    "name": "Tiệm Gội Đầu Dưỡng Sinh",
    "shortName": "Tiệm Gội Đầu Dưỡng Sinh",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_util_013.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 0,
    "coin": 1,
    "stamina": 0,
    "tag": "utility",
    "tagLabel": "Tiện ích",
    "tags": [
      "UTILITY",
      "INDOOR"
    ],
    "icon": "🧰",
    "description": "Đắm chìm trong hương sả chanh và những động tác xoa bóp điêu luyện. Trải nghiệm thư giãn đặc sản này giúp bạn rũ bỏ mọi mệt mỏi.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": true,
      "effect_type": "RECOVER_LA",
      "effect_value": 2
    }
  },
  {
    "id": "SG_UTIL_015",
    "name": "Thuê Thợ Ảnh Dạo",
    "shortName": "Thuê Thợ Ảnh Dạo",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_util_015.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 0,
    "coin": 2,
    "stamina": 0,
    "tag": "utility",
    "tagLabel": "Tiện ích",
    "tags": [
      "UTILITY",
      "OUTDOOR"
    ],
    "icon": "🧰",
    "description": "Bắt gặp một thợ nháy dạo chuyên nghiệp, bạn chi tiền để có bộ ảnh sống ảo chất lượng. Nhân đôi giá trị kỷ niệm cho điểm đến kế tiếp.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": true,
      "effect_type": "DOUBLE_VP_NEXT",
      "effect_value": 1
    }
  },
  {
    "id": "SG_ACT_001",
    "name": "Thảo Cầm Viên Sài Gòn",
    "shortName": "Thảo Cầm Viên Sài Gòn",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_act_001.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 15,
    "coin": 1,
    "stamina": 2,
    "tag": "action",
    "tagLabel": "Trải nghiệm",
    "tags": [
      "ACTION",
      "OUTDOOR"
    ],
    "icon": "🎒",
    "description": "Lạc bước giữa không gian xanh mát của khu bảo tồn động thực vật lâu đời nhất thành phố. Khuôn viên rộng lớn sẽ ngốn của bạn không ít mồ hôi và sức lực.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_ACT_002",
    "name": "Phố Tây Bùi Viện",
    "shortName": "Phố Tây Bùi Viện",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_act_002.png",
    "rarity": "uncommon",
    "rarityLabel": "★★★",
    "vp": 22,
    "coin": 2,
    "stamina": 2,
    "tag": "action",
    "tagLabel": "Trải nghiệm",
    "tags": [
      "ACTION",
      "OUTDOOR"
    ],
    "icon": "🎒",
    "description": "Nhịp sống cuồng nhiệt không ngủ. Bạn vui hết nấc trong tiếng nhạc xập xình, nhưng việc chen lấn giữa biển người sẽ vắt kiệt thể lực của bạn.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_ACT_003",
    "name": "Nhà hát Kịch IDECAF",
    "shortName": "Nhà hát Kịch IDECAF",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_act_003.png",
    "rarity": "uncommon",
    "rarityLabel": "★★★",
    "vp": 20,
    "coin": 3,
    "stamina": 0,
    "tag": "action",
    "tagLabel": "Trải nghiệm",
    "tags": [
      "ACTION",
      "INDOOR"
    ],
    "icon": "🎒",
    "description": "Thưởng thức những vở kịch chất lượng cao trong không gian khán phòng ấm cúng. Trải nghiệm giải trí tuyệt vời mà không tốn một giọt mồ hôi.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_ACT_004",
    "name": "Công viên nước Đầm Sen",
    "shortName": "Công viên nước Đầm Sen",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_act_004.png",
    "rarity": "uncommon",
    "rarityLabel": "★★★",
    "vp": 22,
    "coin": 2,
    "stamina": 2,
    "tag": "action",
    "tagLabel": "Trải nghiệm",
    "tags": [
      "ACTION",
      "OUTDOOR"
    ],
    "icon": "🎒",
    "description": "Vẫy vùng trong làn nước mát lạnh và thử sức với các ống trượt cảm giác mạnh. Một ngày vui chơi tơi bời nhưng cũng đốt cháy toàn bộ năng lượng.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_ACT_005",
    "name": "Snow Town Sài Gòn",
    "shortName": "Snow Town Sài Gòn",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_act_005.png",
    "rarity": "uncommon",
    "rarityLabel": "★★★",
    "vp": 28,
    "coin": 3,
    "stamina": 1,
    "tag": "action",
    "tagLabel": "Trải nghiệm",
    "tags": [
      "ACTION",
      "INDOOR"
    ],
    "icon": "🎒",
    "description": "Trải nghiệm cái lạnh cắt da giữa lòng thành phố nhiệt đới. Chơi đùa với bãi tuyết nhân tạo mang lại cảm giác thích thú lạ kỳ và vô cùng sảng khoái.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_ACT_006",
    "name": "Sân vận động Thống Nhất",
    "shortName": "Sân vận động Thống Nhất",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_act_006.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 12,
    "coin": 1,
    "stamina": 1,
    "tag": "action",
    "tagLabel": "Trải nghiệm",
    "tags": [
      "ACTION",
      "OUTDOOR"
    ],
    "icon": "🎒",
    "description": "Hòa mình vào không khí cuồng nhiệt trên khán đài. Tiếng hò reo cổ vũ vang dội làm bạn vô cùng phấn khích và tiêu hao đôi chút năng lượng.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_ACT_007",
    "name": "Jump Arena HimLam",
    "shortName": "Jump Arena HimLam",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_act_007.png",
    "rarity": "uncommon",
    "rarityLabel": "★★★",
    "vp": 20,
    "coin": 2,
    "stamina": 2,
    "tag": "action",
    "tagLabel": "Trải nghiệm",
    "tags": [
      "ACTION",
      "INDOOR"
    ],
    "icon": "🎒",
    "description": "Thử thách bản thân với các trò chơi nhún nhảy bạt lò xo. Một hoạt động thể chất cường độ cao, đảm bảo khiến bạn thở dốc chỉ sau vài chục phút.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_ACT_008",
    "name": "Khu du lịch Văn Thánh",
    "shortName": "Khu du lịch Văn Thánh",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_act_008.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 15,
    "coin": 2,
    "stamina": 1,
    "tag": "action",
    "tagLabel": "Trải nghiệm",
    "tags": [
      "ACTION",
      "OUTDOOR"
    ],
    "icon": "🎒",
    "description": "Tận hưởng không gian xanh mát và yên bình ven hồ. Một buổi cắm trại dã ngoại nhẹ nhàng giúp gắn kết tình cảm với những người bạn đồng hành.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_ACT_009",
    "name": "Chèo thuyền SUP Thanh Đa",
    "shortName": "Chèo thuyền SUP Thanh Đa",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_act_009.png",
    "rarity": "uncommon",
    "rarityLabel": "★★★",
    "vp": 22,
    "coin": 2,
    "stamina": 2,
    "tag": "action",
    "tagLabel": "Trải nghiệm",
    "tags": [
      "ACTION",
      "OUTDOOR"
    ],
    "icon": "🎒",
    "description": "Khua mái chèo lướt đi trên dòng sông tĩnh lặng ngắm hoàng hôn. Trải nghiệm lãng mạn nhưng cũng đòi hỏi sự thăng bằng và sức mạnh đáng kể từ đôi tay.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_ACT_010",
    "name": "Công viên văn hóa Suối Tiên",
    "shortName": "Công viên văn hóa Suối Tiên",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_act_010.png",
    "rarity": "uncommon",
    "rarityLabel": "★★★",
    "vp": 25,
    "coin": 2,
    "stamina": 3,
    "tag": "action",
    "tagLabel": "Trải nghiệm",
    "tags": [
      "ACTION",
      "OUTDOOR"
    ],
    "icon": "🎒",
    "description": "Khu vui chơi giải trí khổng lồ mang đậm màu sắc văn hóa dân tộc. Đi bộ qua các đền đài và tham gia vô vàn trò chơi sẽ rút cạn sức lực của bạn.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_ACT_011",
    "name": "Khu căn cứ Vàm Sát Đảo Khỉ",
    "shortName": "Khu căn cứ Vàm Sát Đảo Khỉ",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_act_011.png",
    "rarity": "epic",
    "rarityLabel": "★★★★",
    "vp": 35,
    "coin": 3,
    "stamina": 3,
    "tag": "action",
    "tagLabel": "Trải nghiệm",
    "tags": [
      "ACTION",
      "OUTDOOR"
    ],
    "icon": "🎒",
    "description": "Hành trình mạo hiểm tiến sâu vào khu dự trữ sinh quyển ngập mặn. Thách thức lớn về cả khoảng cách di chuyển lẫn sức chịu đựng trước thiên nhiên hoang dã.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_ACT_012",
    "name": "Phố đi bộ Nguyễn Huệ",
    "shortName": "Phố đi bộ Nguyễn Huệ",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_act_012.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 10,
    "coin": 0,
    "stamina": 1,
    "tag": "action",
    "tagLabel": "Trải nghiệm",
    "tags": [
      "ACTION",
      "OUTDOOR"
    ],
    "icon": "🎒",
    "description": "Tản bộ thong dong trên con phố hiện đại bậc nhất nhộn nhịp người qua lại. Khá dễ chịu vào buổi tối nhưng sẽ rút sức bạn nhanh chóng nếu ghé qua vào buổi trưa.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_ACT_013",
    "name": "Saigon Centre",
    "shortName": "Saigon Centre",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_act_013.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 15,
    "coin": 2,
    "stamina": 1,
    "tag": "action",
    "tagLabel": "Trải nghiệm",
    "tags": [
      "ACTION",
      "INDOOR"
    ],
    "icon": "🎒",
    "description": "Chìm đắm trong thế giới mua sắm cao cấp ngập tràn ánh đèn và hàng hiệu. Một trải nghiệm đốt tiền nhanh chóng nhưng bù lại bằng sự thỏa mãn tuyệt đối.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_ACT_014",
    "name": "Khu liên hợp Thể thao Quận 5",
    "shortName": "Khu liên hợp Thể thao Quận 5",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_act_014.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 18,
    "coin": 1,
    "stamina": 2,
    "tag": "action",
    "tagLabel": "Trải nghiệm",
    "tags": [
      "ACTION",
      "INDOOR"
    ],
    "icon": "🎒",
    "description": "Đắm mình dưới làn nước xanh mát của hồ bơi hoặc bung sức tại các sân cầu lông. Lựa chọn tuyệt vời để rèn luyện thể chất vào những ngày nhiệt độ tăng cao.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_ACT_015",
    "name": "Công Viên Bờ Sông Sài Gòn Tp Thủ Đức",
    "shortName": "Công Viên Bờ Sông Sài Gòn Tp Thủ Đức",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_act_015.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 10,
    "coin": 0,
    "stamina": 1,
    "tag": "action",
    "tagLabel": "Trải nghiệm",
    "tags": [
      "ACTION",
      "OUTDOOR"
    ],
    "icon": "🎒",
    "description": "Ngắm nhìn toàn cảnh thành phố lung linh từ phía bờ Đông. Bãi cỏ rộng lớn và gió lộng thổi không ngừng, lý tưởng để dạo mát và thả diều.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_ACT_016",
    "name": "Archery Tag Vietnam",
    "shortName": "Archery Tag Vietnam",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_act_016.png",
    "rarity": "uncommon",
    "rarityLabel": "★★★",
    "vp": 20,
    "coin": 2,
    "stamina": 2,
    "tag": "action",
    "tagLabel": "Trải nghiệm",
    "tags": [
      "ACTION",
      "OUTDOOR"
    ],
    "icon": "🎒",
    "description": "Hóa thân thành cung thủ trong một trận chiến sinh tồn đầy kịch tính. Bạn sẽ phải chạy nước rút, ẩn nấp và ngắm bắn liên tục đến bở hơi tai.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_ACT_017",
    "name": "Sân trượt băng Vincom Landmark 81",
    "shortName": "Sân trượt băng Vincom Landmark 81",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_act_017.png",
    "rarity": "uncommon",
    "rarityLabel": "★★★",
    "vp": 30,
    "coin": 4,
    "stamina": 1,
    "tag": "action",
    "tagLabel": "Trải nghiệm",
    "tags": [
      "ACTION",
      "INDOOR"
    ],
    "icon": "🎒",
    "description": "Mũi giày trượt lướt êm ái trên mặt băng lạnh giá trong tòa nhà cao nhất Việt Nam. Trải nghiệm giải trí xa xỉ tiêu tốn không ít hầu bao của bạn.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_ACT_018",
    "name": "Công viên Tao Đàn",
    "shortName": "Công viên Tao Đàn",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_act_018.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 8,
    "coin": 0,
    "stamina": 1,
    "tag": "action",
    "tagLabel": "Trải nghiệm",
    "tags": [
      "ACTION",
      "OUTDOOR"
    ],
    "icon": "🎒",
    "description": "Lá phổi xanh của thành phố ngập tràn bóng cây cổ thụ. Dạo bước trên những con đường rợp bóng mát là cách tuyệt vời để thư giãn đôi chân mỏi mệt.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_ACT_019",
    "name": "Board Game Station",
    "shortName": "Board Game Station",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_phase_act_019.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 15,
    "coin": 1,
    "stamina": 1,
    "tag": "action",
    "tagLabel": "Trải nghiệm",
    "tags": [
      "ACTION",
      "INDOOR"
    ],
    "icon": "🎒",
    "description": "Đấu trí căng thẳng qua những ván cờ đầy toan tính. Tiếng cười nói rộn rã trong phòng máy lạnh xua tan đi cái mệt nhọc của những chuyến đi dài.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_ACT_020",
    "name": "Trải nghiệm Saigon Waterbus",
    "shortName": "Trải nghiệm Saigon Waterbus",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_act_020.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 12,
    "coin": 1,
    "stamina": 0,
    "tag": "action",
    "tagLabel": "Trải nghiệm",
    "tags": [
      "ACTION",
      "OUTDOOR"
    ],
    "icon": "🎒",
    "description": "Lướt trên mặt sóng ngắm nhìn toàn cảnh đường chân trời hiện đại dọc hai bờ sông. Trải nghiệm ngắm cảnh thư thái tuyệt vời mà không đòi hỏi nhiều sự vận động.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_001",
    "name": "Dinh Độc Lập",
    "shortName": "Dinh Độc Lập",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_001.png",
    "rarity": "uncommon",
    "rarityLabel": "★★★",
    "vp": 22,
    "coin": 3,
    "stamina": 1,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Chứng nhân lịch sử với kiến trúc độc bản. Khám phá các sảnh đường khổng lồ và đường hầm bí mật sẽ tiêu tốn không ít thể lực của bạn.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_002",
    "name": "Bưu điện trung tâm Sài Gòn",
    "shortName": "Bưu điện trung tâm Sài Gòn",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_002.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 10,
    "coin": 1,
    "stamina": 0,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR"
    ],
    "icon": "🏛️",
    "description": "Mái vòm thép vĩ đại mang đậm dấu ấn hoài niệm. Gửi một tấm bưu thiếp và tận hưởng không gian kiến trúc Pháp an toàn, mát mẻ.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_003",
    "name": "Nhà thờ Đức Bà Sài Gòn",
    "shortName": "Nhà thờ Đức Bà Sài Gòn",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_003.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 8,
    "coin": 0,
    "stamina": 1,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Biểu tượng tôn giáo với gạch nung đỏ rực. Chiêm ngưỡng vẻ đẹp cổ kính từ bên ngoài và lắng nghe tiếng chuông ngân vang giữa phố thị.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_004",
    "name": "Bảo tàng Chứng tích Chiến tranh",
    "shortName": "Bảo tàng Chứng tích Chiến tranh",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_004.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 15,
    "coin": 2,
    "stamina": 1,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR"
    ],
    "icon": "🏛️",
    "description": "Trải nghiệm lịch sử sâu sắc và nặng nề. Những tư liệu chân thực khiến bạn tĩnh lặng và tiêu hao đáng kể năng lượng tinh thần.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_005",
    "name": "Bảo tàng Lịch sử Thành phố Hồ Chí Minh",
    "shortName": "Bảo tàng Lịch sử Thành phố Hồ Chí Minh",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_005.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 15,
    "coin": 2,
    "stamina": 1,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR"
    ],
    "icon": "🏛️",
    "description": "Kho tàng di sản ngàn năm của dân tộc. Đi bộ mải miết qua các gian trưng bày rộng lớn đòi hỏi sự bền bỉ của đôi chân.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_006",
    "name": "Bảo tàng Mỹ thuật Thành phố Hồ Chí Minh",
    "shortName": "Bảo tàng Mỹ thuật Thành phố Hồ Chí Minh",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_006.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 15,
    "coin": 2,
    "stamina": 0,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR"
    ],
    "icon": "🏛️",
    "description": "Tòa dinh thự 99 cửa với hành lang ngập nắng. Trạm dừng chân nghệ thuật tuyệt đẹp để cho ra đời những bức ảnh lưu niệm ấn tượng.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_007",
    "name": "Nhà hát Thành phố Hồ Chí Minh",
    "shortName": "Nhà hát Thành phố Hồ Chí Minh",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_007.png",
    "rarity": "epic",
    "rarityLabel": "★★★★",
    "vp": 35,
    "coin": 5,
    "stamina": 0,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Thưởng thức nghệ thuật thính phòng trong một công trình tráng lệ. Một buổi tối đắt đỏ nhưng mang lại trải nghiệm văn hóa đẳng cấp.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_008",
    "name": "UBND Thành phố Hồ Chí Minh",
    "shortName": "UBND Thành phố Hồ Chí Minh",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_008.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 8,
    "coin": 0,
    "stamina": 1,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Kiến trúc thời Pháp tuyệt đẹp ngay trung tâm. Một điểm check-in không tốn kém, nhưng việc nán lại lâu dưới nắng gắt sẽ khiến bạn hao tổn sức lực.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_009",
    "name": "Chùa Ngọc Hoàng",
    "shortName": "Chùa Ngọc Hoàng",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_009.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 12,
    "coin": 1,
    "stamina": 0,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR"
    ],
    "icon": "🏛️",
    "description": "Ngôi chùa cổ linh thiêng ngập trong khói nhang. Nơi du khách tìm kiếm sự bình an và tĩnh lặng giữa nhịp sống hối hả.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_010",
    "name": "Miếu Bà Thiên Hậu - Hội Quán Tuệ Thành",
    "shortName": "Miếu Bà Thiên Hậu - Hội Quán Tuệ Thành",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_010.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 12,
    "coin": 1,
    "stamina": 0,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR"
    ],
    "icon": "🏛️",
    "description": "Tuyệt tác kiến trúc của người Hoa tại Chợ Lớn. Khói nhang vòng cuộn tỏa mang theo những lời cầu nguyện bình an che chở bạn khỏi muộn phiền.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_011",
    "name": "Hội Quán Nghĩa An",
    "shortName": "Hội Quán Nghĩa An",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_011.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 12,
    "coin": 1,
    "stamina": 0,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR"
    ],
    "icon": "🏛️",
    "description": "Rực rỡ với nghệ thuật chạm khắc gỗ tinh xảo. Nơi giao lưu văn hóa và tín ngưỡng đặc sắc của cộng đồng Triều Châu ẩn mình trong khu phố chật hẹp.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_012",
    "name": "Chợ Bình Tây",
    "shortName": "Chợ Bình Tây",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_012.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 15,
    "coin": 2,
    "stamina": 1,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR"
    ],
    "icon": "🏛️",
    "description": "Khu chợ đầu mối sầm uất với kiến trúc hình bát quái. Đôi chân bạn mỏi nhừ vì luồn lách qua hàng ngàn sạp hàng chen chúc.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_013",
    "name": "Nhà thờ Giáo xứ Thánh Phanxicô Xaviê",
    "shortName": "Nhà thờ Giáo xứ Thánh Phanxicô Xaviê",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_013.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 8,
    "coin": 0,
    "stamina": 1,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Sự kết hợp độc đáo giữa kiến trúc Gothic và phong cách Á Đông nằm ngay giữa lòng khu Chợ Lớn sầm uất.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_014",
    "name": "Hội quán Ôn Lăng - Chùa quan âm",
    "shortName": "Hội quán Ôn Lăng - Chùa quan âm",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_014.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 12,
    "coin": 1,
    "stamina": 0,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR"
    ],
    "icon": "🏛️",
    "description": "Ngôi chùa cổ kính với mặt tiền lộng lẫy và những quần thể tượng gốm tinh xảo trải dài trên mái ngói nhuốm màu thời gian.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_015",
    "name": "Bến Nhà Rồng - Bảo tàng Hồ Chí Minh",
    "shortName": "Bến Nhà Rồng - Bảo tàng Hồ Chí Minh",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_015.png",
    "rarity": "uncommon",
    "rarityLabel": "★★★",
    "vp": 20,
    "coin": 3,
    "stamina": 1,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Tòa nhà mang kiến trúc Á-Âu bên bờ sông lộng gió. Không gian lịch sử hào hùng cùng tầm nhìn thoáng đãng ra dòng sông rộng lớn.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_016",
    "name": "Lăng Tả quân Lê Văn Duyệt (Lăng Ông - Bà Chiểu)",
    "shortName": "Lăng Tả quân Lê Văn Duyệt (Lăng Ông - Bà Chiểu)",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_016.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 12,
    "coin": 1,
    "stamina": 1,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Biểu tượng văn hóa lâu đời của đất Gia Định. Việc tản bộ trong khuôn viên rộng lớn và uy nghiêm này đòi hỏi sự bền bỉ của đôi chân.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_017",
    "name": "Địa Đạo Củ Chi - Bến Dược",
    "shortName": "Địa Đạo Củ Chi - Bến Dược",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_017.png",
    "rarity": "epic",
    "rarityLabel": "★★★★",
    "vp": 40,
    "coin": 4,
    "stamina": 3,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Hành trình luồn lách dưới lòng đất hẹp. Một thử thách sinh tồn vắt kiệt thể lực và tốn kém thời gian đi lại, nhưng trải nghiệm lịch sử mang lại thực sự vô giá.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_018",
    "name": "Chiến khu Rừng Sác",
    "shortName": "Chiến khu Rừng Sác",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_018.png",
    "rarity": "epic",
    "rarityLabel": "★★★★",
    "vp": 35,
    "coin": 4,
    "stamina": 2,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Khám phá căn cứ địa giữa rừng ngập mặn Cần Giờ. Hành trình lội rừng vất vả và chặng đường dài sẽ thử thách sức chịu đựng của bạn.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_019",
    "name": "Chùa Bửu Long",
    "shortName": "Chùa Bửu Long",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_019.png",
    "rarity": "uncommon",
    "rarityLabel": "★★★",
    "vp": 25,
    "coin": 2,
    "stamina": 2,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Lộng lẫy như một cung điện Thái Lan thu nhỏ ẩn mình ở vùng ven thành phố. Bạn sẽ mất kha khá thời gian và sức lực để đến được đây, nhưng khung cảnh thì hoàn toàn xứng đáng.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_020",
    "name": "Khu Tưởng niệm Liệt sĩ Ngã ba Giồng",
    "shortName": "Khu Tưởng niệm Liệt sĩ Ngã ba Giồng",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_020.png",
    "rarity": "uncommon",
    "rarityLabel": "★★★",
    "vp": 25,
    "coin": 1,
    "stamina": 2,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Di tích lịch sử oai hùng nằm lặng lẽ ở ngoại ô Hóc Môn. Một chuyến đi dài về vùng ven sẽ thử thách tính kiên nhẫn và sức bền của bất kỳ đôi chân nào.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_021",
    "name": "Đình Bình Hòa",
    "shortName": "Đình Bình Hòa",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_021.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 8,
    "coin": 0,
    "stamina": 0,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Di tích kiến trúc cổ mang đậm dấu ấn làng mạc Nam Bộ xưa. Yên tĩnh, mộc mạc và hoàn toàn tách biệt khỏi nhịp sống ồn ào của phố thị.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_022",
    "name": "Chùa Pháp Vân",
    "shortName": "Chùa Pháp Vân",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_022.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 8,
    "coin": 0,
    "stamina": 0,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR"
    ],
    "icon": "🏛️",
    "description": "Điểm đến tâm linh thanh tịnh. Nơi thích hợp để trú chân, lấy lại sự bình tĩnh và phục hồi tinh thần sau những chặng đường dài.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_024",
    "name": "Bảo tàng Phụ nữ Nam bộ",
    "shortName": "Bảo tàng Phụ nữ Nam bộ",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_024.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 10,
    "coin": 1,
    "stamina": 0,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR"
    ],
    "icon": "🏛️",
    "description": "Tìm hiểu về vẻ đẹp và sự kiên cường của người phụ nữ Nam Bộ. Một không gian mang tính giáo dục và là trạm dừng chân an toàn khỏi thời tiết khắc nghiệt.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_025",
    "name": "Nhà thờ Tân Định (Nhà thờ Màu Hồng)",
    "shortName": "Nhà thờ Tân Định (Nhà thờ Màu Hồng)",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_025.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 10,
    "coin": 1,
    "stamina": 0,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Công trình kiến trúc Gothic rực rỡ với sắc hồng độc đáo. Một bức ảnh check-in tại đây là điều không thể thiếu, dù thời tiết bên ngoài có oi ả đến đâu.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_026",
    "name": "Hẻm Hào Sĩ Phường",
    "shortName": "Hẻm Hào Sĩ Phường",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_026.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 8,
    "coin": 0,
    "stamina": 1,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Con hẻm trăm tuổi mang đậm màu sắc điện ảnh Hong Kong xưa. Đi bộ nhẹ nhàng nhưng mang lại cảm giác bình yên, hoài cổ giữa lòng Chợ Lớn sầm uất.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_027",
    "name": "Phố Lồng Đèn Lương Nhữ Học",
    "shortName": "Phố Lồng Đèn Lương Nhữ Học",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_027.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 10,
    "coin": 1,
    "stamina": 1,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Cả khu phố rực sáng bởi hàng ngàn chiếc lồng đèn thủ công. Vô cùng náo nhiệt nhưng việc luồn lách giữa dòng người đông đúc sẽ làm bạn toát mồ hôi.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_028",
    "name": "Chùa Giác Lâm",
    "shortName": "Chùa Giác Lâm",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_028.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 12,
    "coin": 1,
    "stamina": 0,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR"
    ],
    "icon": "🏛️",
    "description": "Tổ đình lâu đời nhất Sài Gòn với kiến trúc chữ Tam truyền thống. Không gian tĩnh lặng, an toàn để bạn né tránh những cơn mưa rào bất chợt.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_029",
    "name": "Bến Bình Đông",
    "shortName": "Bến Bình Đông",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_029.png",
    "rarity": "common",
    "rarityLabel": "★",
    "vp": 8,
    "coin": 0,
    "stamina": 1,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Tản bộ dọc dòng kênh ngắm nhìn những chiếc thuyền chở đầy hoa trái miền Tây. Một trải nghiệm văn hóa sông nước hiếm hoi còn sót lại.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_030",
    "name": "Bảo tàng TP.HCM (Dinh Gia Long)",
    "shortName": "Bảo tàng TP.HCM (Dinh Gia Long)",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_030.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 15,
    "coin": 2,
    "stamina": 0,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR"
    ],
    "icon": "🏛️",
    "description": "Khám phá câu chuyện phát triển của thành phố trong tòa dinh thự cổ kính. Cầu thang gỗ và những hành lang rộng mở đem đến sự thư thái tuyệt đối.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_031",
    "name": "Việt Nam Quốc Tự",
    "shortName": "Việt Nam Quốc Tự",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_031.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 15,
    "coin": 1,
    "stamina": 1,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Ngôi chùa khổng lồ với bảo tháp sừng sững giữa lòng Quận 10. Khuôn viên rộng lớn đòi hỏi bạn phải đi bộ khá nhiều dưới tiết trời oi ả.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_032",
    "name": "Phố Đồ Cổ Lê Công Kiều",
    "shortName": "Phố Đồ Cổ Lê Công Kiều",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_032.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 15,
    "coin": 1,
    "stamina": 1,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Con phố ngắn ngủi nhưng chứa đựng hàng ngàn món cổ vật. Bạn mất khá nhiều thời gian và công sức để lùng sục những món đồ ưng ý dọc hai bên vỉa hè.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_033",
    "name": "Bảo tàng Y học Cổ truyền Việt Nam (FITO Museum)",
    "shortName": "Bảo tàng Y học Cổ truyền Việt Nam (FITO Museum)",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_033.png",
    "rarity": "uncommon",
    "rarityLabel": "★★",
    "vp": 18,
    "coin": 3,
    "stamina": 0,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR"
    ],
    "icon": "🏛️",
    "description": "Một bảo tàng tư nhân độc đáo với kiến trúc gỗ chạm khắc tinh xảo. Đắt tiền, nhưng trải nghiệm không gian y học cổ truyền dịu mát là vô giá.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_034",
    "name": "Đền Tưởng niệm các Vua Hùng",
    "shortName": "Đền Tưởng niệm các Vua Hùng",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_034.png",
    "rarity": "uncommon",
    "rarityLabel": "★★★",
    "vp": 22,
    "coin": 2,
    "stamina": 2,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Công trình uy nghiêm mang đậm tinh thần dân tộc. Việc lặn lội ra tận vùng ngoại ô ngập nắng sẽ bào mòn đáng kể thể lực của bạn.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_035",
    "name": "Bảo tàng Áo Dài",
    "shortName": "Bảo tàng Áo Dài",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_035.png",
    "rarity": "uncommon",
    "rarityLabel": "★★★",
    "vp": 22,
    "coin": 3,
    "stamina": 1,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Không gian kiến trúc mộc mạc ẩn mình giữa thiên nhiên tĩnh lặng. Một chuyến đi đòi hỏi sự đầu tư lớn về mặt thời gian và sức lực khi phải rời xa chốn thị thành.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  },
  {
    "id": "SG_CULT_036",
    "name": "Tu viện Khánh An",
    "shortName": "Tu viện Khánh An",
    "city": "Sài Gòn",
    "shortCity": "Sài Gòn",
    "image": "images/phase1/sg_cult_036.png",
    "rarity": "uncommon",
    "rarityLabel": "★★★",
    "vp": 20,
    "coin": 2,
    "stamina": 1,
    "tag": "culture",
    "tagLabel": "Văn hóa",
    "tags": [
      "CULTURE",
      "INDOOR",
      "OUTDOOR"
    ],
    "icon": "🏛️",
    "description": "Góc Nhật Bản thu nhỏ với những mảng màu nâu trầm và mái ngói uốn lượn. Nằm khá xa trung tâm thành phố, đòi hỏi bạn phải có một lịch trình di chuyển thật khéo léo.",
    "bonusText": "",
    "onPlayEffect": {
      "has_effect": false,
      "effect_type": "NONE",
      "effect_value": 0
    }
  }
];

void LEGACY_SERVER_CARDS;

const REAL_SERVER_CARDS: ServerCardWithEffect[] = phase1Cards.map((card) => {
  const mapped = mapGameCardToTravelCard(card);

  return {
    ...mapped,
    tags: [...mapped.tags],
    onPlayEffect: { ...mapped.onPlayEffect },
  };
});

function cloneServerCard(card: ServerCardWithEffect): ServerCardWithEffect {
  return {
    ...card,
    tags: [...(card.tags ?? [])],
    onPlayEffect: card.onPlayEffect ? { ...card.onPlayEffect } : card.onPlayEffect,
  };
}

/*
  Server deck thật.
  Lỗi cũ nằm ở đây: createServerDeck() chỉ trả về 21 lá FOOD mẫu,
  nên online room draft ra 100% thẻ Ẩm thực dù client/data đã có đủ 100 lá.
*/
export function createServerDeck(): ServerCardWithEffect[] {
  return REAL_SERVER_CARDS.map(cloneServerCard);
}


const STARTING_COIN = 30;
const STARTING_STAMINA = 15;

export function createEmptyPlayer(
  id: PlayerId,
  name: string,
  isConnected: boolean
): RoomState["players"][PlayerId] {
  return {
    id,
    name,
    hasJoined: isConnected,
    score: 0,
    coin: STARTING_COIN,
    stamina: STARTING_STAMINA,
    usedSlots: 0,
    coinDebt: 0,
    isConnected,
    isReady: false,
    board: createEmptyBoard(),
    draftPool: [],
    pickedDraftCards: [],
    hand: [],
    selectedDraftCardId: null,
    planningConfirmed: false,
  };
}

export function getPublicPlayers(state: RoomState) {
  return {
    p1: stripPrivatePlayerState(state.players.p1),
    p2: stripPrivatePlayerState(state.players.p2),
    p3: stripPrivatePlayerState(state.players.p3),
    p4: stripPrivatePlayerState(state.players.p4),
  };
}

function stripPrivatePlayerState(player: RoomState["players"][PlayerId]) {
  return {
    id: player.id,
    name: player.name,
    score: player.score,
    coin: player.coin,
    stamina: player.stamina,
    usedSlots: player.usedSlots,
    coinDebt: player.coinDebt ?? 0,
    isConnected: player.isConnected,
    isReady: player.isReady,
    hasJoined: player.hasJoined,
    planningConfirmed: player.planningConfirmed === true,
    board: player.board,
  };
}

export function getPlayerViewState(state: RoomState, playerId: PlayerId) {
  const player = state.players[playerId];

  return {
    roomId: state.roomId,
    phase: state.phase,
    phaseNumber: state.phaseNumber ?? 1,
    dayIndex: state.dayIndex,
    draftRound: state.draftRound,
    timer: state.timer,
    draftTimerHold: state.draftTimerHold,
    selfPlayerId: playerId,
    players: getPublicPlayers(state),
    self: {
      draftPool: player.draftPool,
      pickedDraftCards: player.pickedDraftCards,
      hand: player.hand,
      selectedDraftCardId: player.selectedDraftCardId,
      // Đã bấm "Kết thúc lượt" chưa (reset khi vòng xong = mọi người đã pick).
      draftPickConfirmed: player.draftPickConfirmed === true,
    },
  };
}
