const BASE_URL = 'https://www.finch.co.kr';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/category/',
          '/product/',
          '/board/',
          '/order/',
          '/member/',
          '/myshop/',
          '/main/',
          '/shopinfo/',
          '/goods/',
          '/exec/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
