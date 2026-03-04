
import { nasaService } from "./nasa.service";
import { YearSummary, TopicInsight, MediaItem } from "../types/api.types";
import { NasaSearchItem } from "../types/nasa.types";
import { BadRequestError } from "../utils/errors";

/**
 * Count media types across a set of NASA search items.
 */
function countMediaTypes(items: NasaSearchItem[]): {
  image: number;
  video: number;
  audio: number;
} {
  const counts = { image: 0, video: 0, audio: 0 };
  for (const item of items) {
    const type = item.data[0]?.media_type;
    if (type && type in counts) {
      counts[type as keyof typeof counts]++;
    }
  }
  return counts;
}

/**
 * Extract and rank the most common keywords from search results.
 */
function getTopKeywords(
  items: NasaSearchItem[],
  limit: number = 5
): { keyword: string; count: number }[] {
  const keywordCounts = new Map<string, number>();

  for (const item of items) {
    const keywords = item.data[0]?.keywords || [];
    for (const keyword of keywords) {
      const normalized = keyword.trim().toLowerCase();
      keywordCounts.set(normalized, (keywordCounts.get(normalized) || 0) + 1);
    }
  }

  return Array.from(keywordCounts.entries())
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getYearSummary(year: number): Promise<YearSummary> {
  if (year < 1900 || year > new Date().getFullYear()) {
    throw new BadRequestError(
      `Year must be between 1900 and ${new Date().getFullYear()}`
    );
  }

  const yearStr = year.toString();

  // Fetch a large page to get good keyword/type distribution data
  const response = await nasaService.search({
    year_start: yearStr,
    year_end: yearStr,
    page_size: 100,
  });

  const items = response.collection.items;
  const total = response.collection.metadata.total_hits;

  return {
    year,
    totalResults: total,
    byMediaType: countMediaTypes(items),
    topKeywords: getTopKeywords(items),
  };
}

export async function getTopicInsight(keyword: string): Promise<TopicInsight> {
  if (!keyword || keyword.trim().length === 0) {
    throw new BadRequestError("Keyword is required");
  }

  const response = await nasaService.search({
    q: keyword,
    page_size: 100,
  });

  const items = response.collection.items;
  const total = response.collection.metadata.total_hits;

  const sorted = [...items].sort((a, b) => {
    const dateA = new Date(a.data[0]?.date_created || 0).getTime();
    const dateB = new Date(b.data[0]?.date_created || 0).getTime();
    return dateA - dateB;
  });

  const transformItem = (item: NasaSearchItem): MediaItem => ({
    nasaId: item.data[0].nasa_id,
    title: item.data[0].title,
    description: item.data[0].description || "",
    mediaType: item.data[0].media_type,
    dateCreated: item.data[0].date_created,
    center: item.data[0].center,
    keywords: item.data[0].keywords || [],
    photographer: item.data[0].photographer || null,
    thumbnailUrl: item.links?.find((l) => l.rel === "preview")?.href || null,
  });

  return {
    keyword,
    totalResults: total,
    oldestItem: sorted.length > 0 ? transformItem(sorted[0]) : null,
    newestItem:
      sorted.length > 0 ? transformItem(sorted[sorted.length - 1]) : null,
    byMediaType: countMediaTypes(items),
  };
}
