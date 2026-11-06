export type Movie = {
  slug: string;
  title: string;
  originalTitle: string;
  tagline: string;
  genre: string;
  duration: number;
  age: string;
  year: number;
  poster: string;
  status: 'now' | 'soon';
  release: string;
  synopsis: string;
  featured?: boolean;
};

export type Cinema = {
  slug: string;
  name: string;
  chain: string;
  district: string;
  address: string;
  feature: string;
};

export type Showtime = {
  movieSlug: string;
  cinemaSlug: string;
  dayOffset: number;
  format: string;
  times: string[];
};

export const movies: Movie[] = [
  {
    slug: 'sau-anh-hoang-hon', title: 'Sau Ánh Hoàng Hôn',
    originalTitle: 'Beyond the Sunset', tagline: 'Một cuộc gặp gỡ thay đổi tất cả',
    genre: 'Tình cảm', duration: 118, age: 'T13', year: 2026,
    poster: 'sunset', status: 'now', release: 'Đang chiếu',
    synopsis: 'Giữa những nhịp sống vội vã, hai con người tình cờ gặp nhau và bắt đầu hành trình tìm lại những điều tưởng như đã đánh mất.',
    featured: true
  },
  {
    slug: 'tram-cuoi-thien-ha', title: 'Trạm Cuối Thiên Hà',
    originalTitle: 'Last Station', tagline: 'Vũ trụ có thể rộng đến đâu?',
    genre: 'Viễn tưởng', duration: 132, age: 'T13', year: 2026,
    poster: 'cosmos', status: 'now', release: 'Đang chiếu',
    synopsis: 'Một phi hành đoàn bước vào chuyến đi không có trong kế hoạch để tìm tín hiệu bí ẩn từ rìa thiên hà.'
  },
  {
    slug: 'dem-o-sai-gon', title: 'Đêm Ở Sài Gòn',
    originalTitle: 'Saigon After Dark', tagline: 'Thành phố chưa bao giờ ngủ',
    genre: 'Hành động', duration: 109, age: 'T16', year: 2026,
    poster: 'saigon', status: 'now', release: 'Đang chiếu',
    synopsis: 'Một đêm, một lời hứa và cuộc rượt đuổi xuyên qua những con phố rực sáng của thành phố.'
  },
  {
    slug: 'nhung-ngay-xanh', title: 'Những Ngày Xanh',
    originalTitle: 'Green Days', tagline: 'Tuổi trẻ là một lần dám bước đi',
    genre: 'Gia đình', duration: 104, age: 'P', year: 2026,
    poster: 'green', status: 'now', release: 'Đang chiếu',
    synopsis: 'Một nhóm bạn thân trở về vùng quê tuổi thơ, nơi mùa hè cuối cùng dẫn họ đến những lựa chọn trưởng thành.'
  },
  {
    slug: 'ho-so-09', title: 'Hồ Sơ 09',
    originalTitle: 'Case File 09', tagline: 'Mọi bí mật đều để lại dấu vết',
    genre: 'Kinh dị', duration: 112, age: 'T18', year: 2026,
    poster: 'noir', status: 'now', release: 'Đang chiếu',
    synopsis: 'Một điều tra viên nhận được hồ sơ đã bị niêm phong từ nhiều năm trước cùng những manh mối khó lý giải.'
  },
  {
    slug: 'khoang-troi-xa', title: 'Khoảng Trời Xa',
    originalTitle: 'Faraway Sky', tagline: 'Đi thật xa để trở về',
    genre: 'Phiêu lưu', duration: 121, age: 'T13', year: 2026,
    poster: 'sky', status: 'now', release: 'Đang chiếu',
    synopsis: 'Một chuyến hành trình qua những miền đất mới mở ra tình bạn và góc nhìn mới về cuộc sống.'
  },
  {
    slug: 'mua-gio-la', title: 'Mùa Gió Lạ',
    originalTitle: 'The Wind Season', tagline: 'Có những mùa không trở lại',
    genre: 'Tình cảm', duration: 116, age: 'T13', year: 2026,
    poster: 'wind', status: 'soon', release: 'Sắp ra mắt',
    synopsis: 'Những lá thư chưa gửi dẫn một nhà làm phim trẻ quay về nơi bắt đầu của một câu chuyện tình.'
  },
  {
    slug: 'qua-ben-kia-may', title: 'Qua Bên Kia Mây',
    originalTitle: 'Beyond the Clouds', tagline: 'Cuộc phiêu lưu bắt đầu từ một giấc mơ',
    genre: 'Hoạt hình', duration: 96, age: 'P', year: 2026,
    poster: 'clouds', status: 'soon', release: 'Sắp ra mắt',
    synopsis: 'Một cô bé và người bạn nhỏ bay qua những tầng mây để tìm lại âm thanh đã biến mất khỏi thị trấn.'
  },
  {
    slug: 'vet-sang-cuoi-cung', title: 'Vệt Sáng Cuối Cùng',
    originalTitle: 'The Last Light', tagline: 'Một tín hiệu. Một cơ hội.',
    genre: 'Viễn tưởng', duration: 128, age: 'T16', year: 2026,
    poster: 'flare', status: 'soon', release: 'Sắp ra mắt',
    synopsis: 'Một kỹ sư phát hiện tín hiệu cuối cùng từ vệ tinh và buộc phải đưa ra quyết định có thể thay đổi tương lai.'
  }
];

// All entries below are fictitious UI fixtures. They MUST NOT be exposed as live showtimes.
export const cinemas: Cinema[] = [
  {
    slug: 'cgv-vincom-dong-khoi', name: 'CGV Vincom Đồng Khởi', chain: 'CGV',
    district: 'Quận 1', address: 'TP. Hồ Chí Minh', feature: 'Trung tâm thành phố'
  },
  {
    slug: 'galaxy-nguyen-du', name: 'Galaxy Nguyễn Du', chain: 'Galaxy Cinema',
    district: 'Quận 1', address: 'TP. Hồ Chí Minh', feature: 'Dễ di chuyển'
  },
  {
    slug: 'lotte-nam-sai-gon', name: 'Lotte Cinema Nam Sài Gòn', chain: 'Lotte Cinema',
    district: 'Quận 7', address: 'TP. Hồ Chí Minh', feature: 'Nhiều khung giờ'
  },
  {
    slug: 'beta-quang-trung', name: 'Beta Quang Trung', chain: 'Beta Cinemas',
    district: 'Gò Vấp', address: 'TP. Hồ Chí Minh', feature: 'Phù hợp nhóm bạn'
  }
];

export const showtimes: Showtime[] = [
  { movieSlug: 'sau-anh-hoang-hon', cinemaSlug: 'cgv-vincom-dong-khoi', dayOffset: 0, format: '2D · Phụ đề', times: ['10:30', '13:15', '17:40', '20:10'] },
  { movieSlug: 'tram-cuoi-thien-ha', cinemaSlug: 'cgv-vincom-dong-khoi', dayOffset: 0, format: '2D · Phụ đề', times: ['11:45', '16:20', '21:00'] },
  { movieSlug: 'dem-o-sai-gon', cinemaSlug: 'cgv-vincom-dong-khoi', dayOffset: 0, format: '2D · Phụ đề', times: ['14:10', '19:20'] },
  { movieSlug: 'sau-anh-hoang-hon', cinemaSlug: 'galaxy-nguyen-du', dayOffset: 0, format: '2D · Phụ đề', times: ['09:50', '15:30', '19:00', '21:30'] },
  { movieSlug: 'nhung-ngay-xanh', cinemaSlug: 'galaxy-nguyen-du', dayOffset: 0, format: '2D · Lồng tiếng', times: ['10:15', '13:40', '18:30'] },
  { movieSlug: 'ho-so-09', cinemaSlug: 'lotte-nam-sai-gon', dayOffset: 0, format: '2D · Phụ đề', times: ['12:00', '18:20', '22:00'] },
  { movieSlug: 'khoang-troi-xa', cinemaSlug: 'lotte-nam-sai-gon', dayOffset: 0, format: '2D · Phụ đề', times: ['11:00', '16:45', '20:25'] },
  { movieSlug: 'sau-anh-hoang-hon', cinemaSlug: 'beta-quang-trung', dayOffset: 0, format: '2D · Phụ đề', times: ['12:50', '16:10', '19:40'] },
  { movieSlug: 'dem-o-sai-gon', cinemaSlug: 'beta-quang-trung', dayOffset: 0, format: '2D · Phụ đề', times: ['14:45', '21:15'] },
  { movieSlug: 'sau-anh-hoang-hon', cinemaSlug: 'cgv-vincom-dong-khoi', dayOffset: 1, format: '2D · Phụ đề', times: ['11:15', '15:40', '20:20'] },
  { movieSlug: 'tram-cuoi-thien-ha', cinemaSlug: 'cgv-vincom-dong-khoi', dayOffset: 1, format: '2D · Phụ đề', times: ['13:00', '19:15'] },
  { movieSlug: 'nhung-ngay-xanh', cinemaSlug: 'galaxy-nguyen-du', dayOffset: 1, format: '2D · Lồng tiếng', times: ['10:20', '16:15'] },
  { movieSlug: 'sau-anh-hoang-hon', cinemaSlug: 'galaxy-nguyen-du', dayOffset: 1, format: '2D · Phụ đề', times: ['12:15', '18:10'] },
  { movieSlug: 'ho-so-09', cinemaSlug: 'lotte-nam-sai-gon', dayOffset: 1, format: '2D · Phụ đề', times: ['14:20', '21:25'] },
  { movieSlug: 'khoang-troi-xa', cinemaSlug: 'lotte-nam-sai-gon', dayOffset: 1, format: '2D · Phụ đề', times: ['09:30', '18:45'] },
  { movieSlug: 'dem-o-sai-gon', cinemaSlug: 'beta-quang-trung', dayOffset: 1, format: '2D · Phụ đề', times: ['16:30', '20:30'] },
  { movieSlug: 'tram-cuoi-thien-ha', cinemaSlug: 'cgv-vincom-dong-khoi', dayOffset: 2, format: '2D · Phụ đề', times: ['10:40', '18:40'] },
  { movieSlug: 'sau-anh-hoang-hon', cinemaSlug: 'galaxy-nguyen-du', dayOffset: 2, format: '2D · Phụ đề', times: ['13:45', '20:10'] },
  { movieSlug: 'nhung-ngay-xanh', cinemaSlug: 'galaxy-nguyen-du', dayOffset: 2, format: '2D · Lồng tiếng', times: ['11:20', '17:00'] },
  { movieSlug: 'ho-so-09', cinemaSlug: 'lotte-nam-sai-gon', dayOffset: 2, format: '2D · Phụ đề', times: ['15:20', '21:45'] },
  { movieSlug: 'khoang-troi-xa', cinemaSlug: 'beta-quang-trung', dayOffset: 2, format: '2D · Phụ đề', times: ['10:20', '18:10'] }
];

export const findMovie = (slug: string) => movies.find((movie) => movie.slug === slug);
export const findCinema = (slug: string) => cinemas.find((cinema) => cinema.slug === slug);
