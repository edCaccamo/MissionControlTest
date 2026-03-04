
import { nasaService } from "./nasa.service";
import { Dashboard, MediaItem } from "../types/api.types";

export async function getDashboard(
  keyword: string = "Earth"
): Promise<Dashboard> {
  const [marsResponse, apolloResponse, keywordResponse] = await Promise.all([
    nasaService.search({
      q: "Mars",
      media_type: "image",
      page_size: 1,
    }),
    nasaService.search({
      q: "Apollo",
      page_size: 1,
    }),
    nasaService.search({
      q: keyword,
      page_size: 100,
    }),
  ]);

  const marsItem = marsResponse.collection.items[0];
  const latestMarsImage: MediaItem | null = marsItem
    ? {
        nasaId: marsItem.data[0].nasa_id,
        title: marsItem.data[0].title,
        description: marsItem.data[0].description || "",
        mediaType: marsItem.data[0].media_type,
        dateCreated: marsItem.data[0].date_created,
        center: marsItem.data[0].center,
        keywords: marsItem.data[0].keywords || [],
        photographer: marsItem.data[0].photographer || null,
        thumbnailUrl:
          marsItem.links?.find((l) => l.rel === "preview")?.href || null,
      }
    : null;

  const byMediaType = { image: 0, video: 0, audio: 0 };
  for (const item of keywordResponse.collection.items) {
    const type = item.data[0]?.media_type;
    if (type && type in byMediaType) {
      byMediaType[type as keyof typeof byMediaType]++;
    }
  }

  return {
    latestMarsImage,
    apolloTotalResults: apolloResponse.collection.metadata.total_hits,
    keywordDistribution: {
      keyword,
      byMediaType,
    },
  };
}
