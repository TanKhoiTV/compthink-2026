import type { TravelCard } from '../types.ts';

/**
 * Phase 1 Saigon food cards (30 cards)
 * Source: Trekkopoly/src/data/cards.phase1.ts
 * Image files: public/assets/images/cards/saigon/food/sg_food_NNN.jpg
 *
 * Only 6 card images exist (sg_food_001-006.jpg). Cards beyond 006
 * cycle through images by rarity bracket for best-fit assignment.
 */
export const saigonFoodCards: TravelCard[] = [{
  id: 'SG_FOOD_001',
  card_id: 'SG_FOOD_001',  // backward compat — same as id
  name: 'Cà Phê Bệt Nhà Thờ Đức Bà',
  description: 'Trải nghiệm vỉa hè chuẩn Sài Gòn. Thức uống siêu rẻ nhưng bạn phải đánh cược với thời tiết nắng mưa bất chợt.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'OUTDOOR'],
  tag: 'FOOD',
  coin: 1,
  cost: 1,  // backward compat — same as coin
  stamina: 0,
  vp: 5,
  victory_point: 5,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_001.jpg',
  icon: '☕',
  rarity: 'common',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7798, lng: 106.699 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_002',
  card_id: 'SG_FOOD_002',  // backward compat — same as id
  name: 'Ăn Vặt Hồ Con Rùa',
  description: 'Tụ điểm hóng gió lý tưởng nhưng khói bụi giao thông là điều không thể tránh khỏi.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'OUTDOOR'],
  tag: 'FOOD',
  coin: 1,
  cost: 1,  // backward compat — same as coin
  stamina: 0,
  vp: 5,
  victory_point: 5,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_002.jpg',
  icon: '🍽️',
  rarity: 'common',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7828, lng: 106.6955 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_003',
  card_id: 'SG_FOOD_003',  // backward compat — same as id
  name: 'Cà Phê Vợt Cheo Leo',
  description: 'Hương vị thời gian đọng lại trong quán cà phê vợt lâu đời nhất thành phố. Yên bình, rẻ và an toàn tuyệt đối.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'INDOOR'],
  tag: 'FOOD',
  coin: 1,
  cost: 1,  // backward compat — same as coin
  stamina: 0,
  vp: 8,
  victory_point: 8,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_003.jpg',
  icon: '☕',
  rarity: 'common',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7685, lng: 106.678 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_004',
  card_id: 'SG_FOOD_004',  // backward compat — same as id
  name: 'Phá Lấu Bò Cô Oanh (Quận 4)',
  description: 'Chén phá lấu đỏ au, thơm lừng nước cốt dừa ăn kèm bánh mì nóng giòn. Ngồi ghế súp vỉa hè ngắm xe cộ qua lại đúng chất dân chơi Quận 4.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'OUTDOOR'],
  tag: 'FOOD',
  coin: 1,
  cost: 1,  // backward compat — same as coin
  stamina: 0,
  vp: 5,
  victory_point: 5,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_004.jpg',
  icon: '🍽️',
  rarity: 'common',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7598, lng: 106.7015 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_005',
  card_id: 'SG_FOOD_005',  // backward compat — same as id
  name: 'Súp Cua Chợ Tân Định',
  description: 'Chén súp nóng hổi, đặc ruột cạnh ngôi chợ hồng biểu tượng. Cứu đói nhanh gọn cho hành trình dài.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'OUTDOOR'],
  tag: 'FOOD',
  coin: 1,
  cost: 1,  // backward compat — same as coin
  stamina: 0,
  vp: 5,
  victory_point: 5,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_005.jpg',
  icon: '🍽️',
  rarity: 'common',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7895, lng: 106.6881 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_006',
  card_id: 'SG_FOOD_006',  // backward compat — same as id
  name: 'Bánh Mì Huỳnh Hoa',
  description: 'Ổ bánh mì nặng trịch pate, ăn một nửa cũng đủ no. Đổi lại, bạn phải kiên nhẫn xếp hàng mua mang đi.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'OUTDOOR'],
  tag: 'FOOD',
  coin: 2,
  cost: 2,  // backward compat — same as coin
  stamina: 0,
  vp: 10,
  victory_point: 10,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_006.jpg',
  icon: '🥖',
  rarity: 'uncommon',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7715, lng: 106.6931 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_007',
  card_id: 'SG_FOOD_007',  // backward compat — same as id
  name: 'Phố Ẩm Thực Hồ Thị Kỷ',
  description: 'Thiên đường ăn vặt và mùi hoa tươi đan xen. Ăn no căng bụng nhưng rã rời đôi chân vì chen lấn.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'OUTDOOR'],
  tag: 'FOOD',
  coin: 2,
  cost: 2,  // backward compat — same as coin
  stamina: 1,
  vp: 15,
  victory_point: 15,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_001.jpg',
  icon: '🍽️',
  rarity: 'uncommon',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7671, lng: 106.6773 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_008',
  card_id: 'SG_FOOD_008',  // backward compat — same as id
  name: 'Cà Phê Chung Cư 42 Nguyễn Huệ',
  description: 'Trạm nghỉ chân hoài cổ nhìn ra phố đi bộ hiện đại. Nơi trú mưa hoàn hảo giữa lịch trình cạn kiệt.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'INDOOR'],
  tag: 'FOOD',
  coin: 2,
  cost: 2,  // backward compat — same as coin
  stamina: 0,
  vp: 12,
  victory_point: 12,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_002.jpg',
  icon: '☕',
  rarity: 'uncommon',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7743, lng: 106.7031 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_009',
  card_id: 'SG_FOOD_009',  // backward compat — same as id
  name: 'Phố Sủi Cảo Hà Tôn Quyền',
  description: 'Tiếng gọi món rôm rả cả góc phố người Hoa. Nằm xa trung tâm nên hãy cẩn thận bẫy khoảng cách di chuyển.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'OUTDOOR'],
  tag: 'FOOD',
  coin: 2,
  cost: 2,  // backward compat — same as coin
  stamina: 0,
  vp: 12,
  victory_point: 12,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_003.jpg',
  icon: '🍽️',
  rarity: 'uncommon',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7592, lng: 106.6558 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_010',
  card_id: 'SG_FOOD_010',  // backward compat — same as id
  name: 'Cơm Tấm Ba Ghiền',
  description: 'Miếng sườn nướng than to bằng cái đĩa. Trải nghiệm no nê.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'INDOOR'],
  tag: 'FOOD',
  coin: 2,
  cost: 2,  // backward compat — same as coin
  stamina: 1,
  vp: 15,
  victory_point: 15,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_004.jpg',
  icon: '🍚',
  rarity: 'uncommon',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7951, lng: 106.6781 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_011',
  card_id: 'SG_FOOD_011',  // backward compat — same as id
  name: 'Phố Ốc Vĩnh Khánh',
  description: 'Mùi bơ tỏi và mỡ hành nức mũi. Đại diện xuất sắc nhất cho văn hóa ăn ốc của giới trẻ thành phố.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'OUTDOOR'],
  tag: 'FOOD',
  coin: 2,
  cost: 2,  // backward compat — same as coin
  stamina: 0,
  vp: 12,
  victory_point: 12,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_005.jpg',
  icon: '🍽️',
  rarity: 'uncommon',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7601, lng: 106.7029 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_012',
  card_id: 'SG_FOOD_012',  // backward compat — same as id
  name: 'Bánh Xèo Đinh Công Tráng',
  description: 'Tiệm bánh xèo miền Nam truyền thống ẩn trong hẻm. Vừa giòn.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'INDOOR'],
  tag: 'FOOD',
  coin: 2,
  cost: 2,  // backward compat — same as coin
  stamina: 0,
  vp: 10,
  victory_point: 10,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_006.jpg',
  icon: '🍽️',
  rarity: 'uncommon',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7901, lng: 106.689 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_013',
  card_id: 'SG_FOOD_013',  // backward compat — same as id
  name: 'Chè Hà Ký Chợ Lớn',
  description: 'Chè trứng gà trà, chè mè đen trứ danh. Điểm chốt ngọt ngào sau chuyến khám phá văn hóa phố Tàu.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'INDOOR'],
  tag: 'FOOD',
  coin: 2,
  cost: 2,  // backward compat — same as coin
  stamina: 0,
  vp: 10,
  victory_point: 10,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_001.jpg',
  icon: '🍽️',
  rarity: 'uncommon',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7516, lng: 106.6622 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_014',
  card_id: 'SG_FOOD_014',  // backward compat — same as id
  name: 'Phở Hòa Pasteur',
  description: 'Biểu tượng Phở miền Nam nổi tiếng với khách quốc tế. Không gian lịch sự, giá cao nhưng trải nghiệm tròn trịa.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'INDOOR'],
  tag: 'FOOD',
  coin: 3,
  cost: 3,  // backward compat — same as coin
  stamina: 0,
  vp: 15,
  victory_point: 15,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_002.jpg',
  icon: '🍜',
  rarity: 'epic',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7892, lng: 106.6896 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_015',
  card_id: 'SG_FOOD_015',  // backward compat — same as id
  name: 'Lẩu Cá Kèo Bà Huyện Thanh Quan',
  description: 'Nồi lẩu chua lá giang sôi sùng sục cùng cá kèo tươi rói. Biểu tượng nhậu lai rai cực kỳ bén mồi của người miền Nam.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'INDOOR'],
  tag: 'FOOD',
  coin: 3,
  cost: 3,  // backward compat — same as coin
  stamina: 0,
  vp: 18,
  victory_point: 18,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_003.jpg',
  icon: '🍲',
  rarity: 'epic',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7785, lng: 106.6858 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_016',
  card_id: 'SG_FOOD_016',  // backward compat — same as id
  name: 'Quán Bụi - Hương Vị Quê Nhà',
  description: 'Những món ăn thuần Việt được nâng tầm tinh tế. Không gian hoài cổ với chén sành, đũa tre, mang lại lượng điểm ổn định giữa lòng Quận 1.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'INDOOR'],
  tag: 'FOOD',
  coin: 3,
  cost: 3,  // backward compat — same as coin
  stamina: 0,
  vp: 18,
  victory_point: 18,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_004.jpg',
  icon: '🍽️',
  rarity: 'epic',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7831, lng: 106.7025 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_017',
  card_id: 'SG_FOOD_017',  // backward compat — same as id
  name: 'Dimsum Tiến Phát',
  description: 'Bữa sáng xa xỉ kiểu Quảng Đông. Đánh đổi số tiền lớn để thu về lượng điểm khổng lồ ngay từ lúc bình minh.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'INDOOR'],
  tag: 'FOOD',
  coin: 4,
  cost: 4,  // backward compat — same as coin
  stamina: 0,
  vp: 25,
  victory_point: 25,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_005.jpg',
  icon: '🍽️',
  rarity: 'epic',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7538, lng: 106.6631 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_018',
  card_id: 'SG_FOOD_018',  // backward compat — same as id
  name: 'Nhà Hàng Chay Hum',
  description: 'Không gian thiền tịnh, thức ăn thanh lọc. Mọi muộn phiền tan biến, cơ thể bạn được hồi phục sinh lực hoàn toàn.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'INDOOR'],
  tag: 'FOOD',
  coin: 4,
  cost: 4,  // backward compat — same as coin
  stamina: 0,
  vp: 15,
  victory_point: 15,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_006.jpg',
  icon: '🍽️',
  rarity: 'epic',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7811, lng: 106.6914 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_019',
  card_id: 'SG_FOOD_019',  // backward compat — same as id
  name: 'Ăn Tối Du Thuyền Sông Sài Gòn',
  description: 'Thưởng thức bít tết và rượu vang trôi dọc dòng sông rực sáng ánh đèn. Trải nghiệm đắt đỏ nhưng xứng đáng từng đồng.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'ACTION'],
  tag: 'FOOD',
  coin: 5,
  cost: 5,  // backward compat — same as coin
  stamina: 0,
  vp: 35,
  victory_point: 35,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_001.jpg',
  icon: '🍽️',
  rarity: 'legendary',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.763, lng: 106.7071 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_020',
  card_id: 'SG_FOOD_020',  // backward compat — same as id
  name: 'Harpers-Bazaar Tầng 79 Landmark 81',
  description: 'Bữa ăn trên đỉnh bầu trời Sài Gòn. Bạn đốt ngót nghét 60% ngân sách khởi điểm để giáng đòn chí mạng về điểm số.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'INDOOR'],
  tag: 'FOOD',
  coin: 6,
  cost: 6,  // backward compat — same as coin
  stamina: 0,
  vp: 45,
  victory_point: 45,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_002.jpg',
  icon: '🍽️',
  rarity: 'legendary',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.795, lng: 106.7218 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_021',
  card_id: 'SG_FOOD_021',  // backward compat — same as id
  name: 'Cơm Quê Dượng Bầu',
  description: 'Mâm cơm quê mộc mạc với trứng chiên, canh chua nhưng được phục vụ trong không gian sang trọng bậc nhất. Trải nghiệm tìm về tuổi thơ nhưng với một cái giá của người trưởng thành.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'INDOOR'],
  tag: 'FOOD',
  coin: 5,
  cost: 5,  // backward compat — same as coin
  stamina: 0,
  vp: 35,
  victory_point: 35,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_003.jpg',
  icon: '🍚',
  rarity: 'legendary',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7725, lng: 106.6901 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_022',
  card_id: 'SG_FOOD_022',  // backward compat — same as id
  name: 'Ly Dừa Tắc Pasteur',
  description: 'Thức uống giải nhiệt huyền thoại dưới những tán cây cổ thụ. Rẻ, mát lạnh nhưng bạn phải đứng uống giữa khói bụi dòng xe qua lại.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'OUTDOOR'],
  tag: 'FOOD',
  coin: 1,
  cost: 1,  // backward compat — same as coin
  stamina: 0,
  vp: 5,
  victory_point: 5,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_004.jpg',
  icon: '☕',
  rarity: 'common',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7891, lng: 106.6894 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_023',
  card_id: 'SG_FOOD_023',  // backward compat — same as id
  name: 'Bột Chiên Đạt Thành',
  description: 'Đĩa bột chiên giòn rụm với trứng và đu đủ ngâm chua. Nằm sâu trong khu người Hoa, giá rẻ và an toàn tuyệt đối khỏi những cơn mưa.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'INDOOR'],
  tag: 'FOOD',
  coin: 1,
  cost: 1,  // backward compat — same as coin
  stamina: 0,
  vp: 8,
  victory_point: 8,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_005.jpg',
  icon: '🍽️',
  rarity: 'common',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7545, lng: 106.6642 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_024',
  card_id: 'SG_FOOD_024',  // backward compat — same as id
  name: 'Xôi Mặn Bùi Thị Xuân',
  description: 'Gói xôi thập cẩm bọc lá chuối chắc nịch đầy lạp xưởng và chà bông. Bữa sáng quốc dân cung cấp năng lượng tức thì để bắt đầu ngày mới.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'OUTDOOR'],
  tag: 'FOOD',
  coin: 1,
  cost: 1,  // backward compat — same as coin
  stamina: 0,
  vp: 5,
  victory_point: 5,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_006.jpg',
  icon: '🍽️',
  rarity: 'common',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7681, lng: 106.688 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_025',
  card_id: 'SG_FOOD_025',  // backward compat — same as id
  name: 'Lẩu Bò Tí Chuột',
  description: 'Nồi lẩu khói nghi ngút bên vỉa hè sầm uất. Ngon rẻ và rất dễ để tụ tập nối Combo với bạn bè vào buổi tối muộn.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'OUTDOOR'],
  tag: 'FOOD',
  coin: 2,
  cost: 2,  // backward compat — same as coin
  stamina: 0,
  vp: 12,
  victory_point: 12,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_001.jpg',
  icon: '🍲',
  rarity: 'uncommon',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.764, lng: 106.6835 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_026',
  card_id: 'SG_FOOD_026',  // backward compat — same as id
  name: 'Bún Thịt Nướng Kiều Bảo',
  description: 'Hương vị thịt nướng sả ướp đậm đà lan tỏa cả góc phố. Một lựa chọn cực kỳ chắc bụng, miễn nhiễm với thời tiết xấu.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'INDOOR'],
  tag: 'FOOD',
  coin: 2,
  cost: 2,  // backward compat — same as coin
  stamina: 0,
  vp: 10,
  victory_point: 10,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_002.jpg',
  icon: '🍽️',
  rarity: 'uncommon',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7761, lng: 106.666 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_027',
  card_id: 'SG_FOOD_027',  // backward compat — same as id
  name: 'Ốc Như Điện Biên Phủ',
  description: 'Một trong những tiệm ốc chất lượng nhất. Bạn được ăn ngon, an toàn nhưng phải chầu chực xếp hàng lấy số đến mức hao mòn thể lực.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'INDOOR'],
  tag: 'FOOD',
  coin: 2,
  cost: 2,  // backward compat — same as coin
  stamina: 1,
  vp: 15,
  victory_point: 15,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_003.jpg',
  icon: '🍽️',
  rarity: 'uncommon',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7718, lng: 106.6811 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_028',
  card_id: 'SG_FOOD_028',  // backward compat — same as id
  name: 'Tàu Hũ Đá Xe Lam',
  description: 'Chén tàu hũ truyền thống kết hợp topping hiện đại. Khuất bóng ở khu phố ẩm thực sầm uất, là trạm nghỉ chân ngọt ngào và mát lạnh.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'INDOOR'],
  tag: 'FOOD',
  coin: 2,
  cost: 2,  // backward compat — same as coin
  stamina: 0,
  vp: 10,
  victory_point: 10,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_004.jpg',
  icon: '🛵',
  rarity: 'uncommon',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7965, lng: 106.6912 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_029',
  card_id: 'SG_FOOD_029',  // backward compat — same as id
  name: 'Lẩu Cua Đất Mũi',
  description: 'Thưởng thức cua Cà Mau chắc thịt trong không gian máy lạnh. Tốn kém nhưng lại mang đến lượng VP khổng lồ vô cùng an toàn.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'INDOOR'],
  tag: 'FOOD',
  coin: 4,
  cost: 4,  // backward compat — same as coin
  stamina: 0,
  vp: 22,
  victory_point: 22,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_005.jpg',
  icon: '🍲',
  rarity: 'epic',
  city: 'Saigon',
  onPlayEffect: undefined,
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7621, lng: 106.6912 },
  is_virtual: false,
}, {
  id: 'SG_FOOD_030',
  card_id: 'SG_FOOD_030',  // backward compat — same as id
  name: 'Noir. Dining in the Dark',
  description: 'Bữa ăn tuyệt mật hoàn toàn trong bóng tối, được phục vụ bởi người khiếm thị. Trải nghiệm ẩm thực thức tỉnh mọi giác quan khiến tâm trí bạn kiệt sức nhưng ấn tượng sâu sắc.',
  phase_pool: 'SAIGON',
  tags: ['FOOD', 'INDOOR'],
  tag: 'FOOD',
  coin: 5,
  cost: 5,  // backward compat — same as coin
  stamina: 0,
  vp: 35,
  victory_point: 35,  // backward compat — same as vp
  image: 'assets/images/cards/saigon/food/sg_food_006.jpg',
  icon: '🍽️',
  rarity: 'legendary',
  city: 'Saigon',
  onPlayEffect: { has_effect: true, effect_type: 'DEDUCT_LA', effect_value: 1 },
  on_play_effect: '',  // backward compat — empty string (derived from onPlayEffect)
  coordinates: { lat: 10.7885, lng: 106.6948 },
  is_virtual: false,
}];
