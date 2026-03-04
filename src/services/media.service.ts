
import { nasaService } from "./nasa.service";
import { MediaItem, MediaDetail, PaginatedResponse } from "../types/api.types";
import { NasaSearchItem } from "../types/nasa.types";
import {
  PaginationParams,
  buildPaginationMeta,
} from "../utils/pagination";
import { NotFoundError } from "../utils/errors";

/** Normalizes a raw NASA search item into our MediaItem shape. */
function transformToMediaItem(item: NasaSearchItem): MediaItem {
  const data = item.data[0]; // NASA always nests data in an array
  const thumbnail = item.links?.find((link) => link.rel === "preview");

  return {
    nasaId: data.nasa_id,
    title: data.title,
    description: data.description || data.description_508 || "",
    mediaType: data.media_type,
    dateCreated: data.date_created,
    center: data.center,
    keywords: data.keywords || [],
    photographer: data.photographer || data.secondary_creator || null,
    thumbnailUrl: thumbnail?.href || null,
  };
}

export async function searchMedia(
  params: {
    q?: string;
    mediaType?: string;
    yearStart?: string;
    yearEnd?: string;
    keywords?: string;
  },
  pagination: PaginationParams
): Promise<PaginatedResponse<MediaItem>> {
  const nasaResponse = await nasaService.search({
    q: params.q,
    media_type: params.mediaType,
    year_start: params.yearStart,
    year_end: params.yearEnd,
    keywords: params.keywords,
    page: pagination.page,
    page_size: pagination.pageSize,
  });

  const items = nasaResponse.collection.items.map(transformToMediaItem);
  const total = nasaResponse.collection.metadata.total_hits;

  return {
    data: items,
    pagination: buildPaginationMeta(total, pagination),
  };
}

export async function getMediaDetail(nasaId: string): Promise<MediaDetail> {
  const [searchResponse, assetResponse, metadata] = await Promise.all([
    nasaService.search({ nasa_id: nasaId }),
    nasaService.getAsset(nasaId),
    nasaService.getMetadata(nasaId),
  ]);

  const item = searchResponse.collection.items[0];
  if (!item) {
    throw new NotFoundError(`Media item not found: ${nasaId}`);
  }

  const baseItem = transformToMediaItem(item);
  const assetUrls = assetResponse.collection.items.map((a) => a.href);

  return {
    ...baseItem,
    assetUrls,
    metadata,
    location: item.data[0]?.location || null,
  };
}
