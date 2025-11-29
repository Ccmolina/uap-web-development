
const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes";
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY ?? "";

export async function searchBooksApi({
  query,
  maxResults = 10,
  orderBy = "relevance",
}: {
  query: string;
  maxResults?: number;
  orderBy?: string;
}) {
  if (!query) {
    return { error: "Query vacío", items: [] };
  }

  const url = `${GOOGLE_BOOKS_URL}?q=${encodeURIComponent(
    query
  )}&maxResults=${maxResults}&orderBy=${orderBy}&key=${API_KEY}`;

  const res = await fetch(url);

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    return {
      error: `Google Books devolvió ${res.status}`,
      status: res.status,
      raw: raw.slice(0, 300),
      items: [],
    };
  }

  const json = await res.json();
  return json ?? { items: [] };
}

export async function getBookDetailsApi(bookId: string) {
  if (!bookId) return { error: "Falta bookId" };

  const url = `${GOOGLE_BOOKS_URL}/${bookId}?key=${API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    return {
      error: `Google Books devolvió ${res.status}`,
      status: res.status,
      raw: raw.slice(0, 300),
    };
  }

  const json = await res.json();
  return json ?? {};
}
