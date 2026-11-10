// Only verifiable, film-specific links. No scraped comments or copied reviews.
// Add entries only when the movie/title and publisher can be verified.
export const editorialMedia = Object.freeze({
  'bò sữa bay': {
    trailer: 'https://www.youtube.com/watch?v=uaebGAUr8rM',
    trailerSource: 'Cinestar Cinemas Vietnam · First Look',
    reviews: [
      {
        title: 'Bò sữa bay – phim kỳ ảo đuối sức ở kịch bản',
        publisher: 'VnExpress',
        url: 'https://vnexpress.net/giai-tri/phim/thu-vien-phim/flying-cows-933',
        spoilers: true
      },
      {
        title: 'Bò Sữa Bay: Phép màu chấp chới giữa đồi cỏ xanh',
        publisher: 'ELLE Việt Nam',
        url: 'https://www.elle.vn/the-gioi-van-hoa/review-bo-sua-bay-phep-mau-chap-choi-giua-doi-co-xanh/',
        spoilers: false
      }
    ]
  },
  'ngày con còn mẹ': {
    trailer: 'https://www.youtube.com/watch?v=c4zgZ2s5N_Y',
    trailerSource: 'CGV Cinemas Vietnam · First Look'
  },
  'clayface': {
    trailer: 'https://www.youtube.com/watch?v=OGO4Mqvo3jI',
    trailerSource: 'DC · Official Trailer'
  }
});
