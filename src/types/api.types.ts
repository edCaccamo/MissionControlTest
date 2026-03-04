
export interface MediaItem {
  nasaId: string;
  title: string;
  description: string;
  mediaType: "image" | "video" | "audio";
  dateCreated: string;
  center: string;
  keywords: string[];
  photographer: string | null;
  thumbnailUrl: string | null;
}

export interface MediaDetail extends MediaItem {
  assetUrls: string[];
  metadata: Record<string, unknown> | null;
  location: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface YearSummary {
  year: number;
  totalResults: number;
  byMediaType: {
    image: number;
    video: number;
    audio: number;
  };
  topKeywords: { keyword: string; count: number }[];
}

export interface TopicInsight {
  keyword: string;
  totalResults: number;
  oldestItem: MediaItem | null;
  newestItem: MediaItem | null;
  byMediaType: {
    image: number;
    video: number;
    audio: number;
  };
}

export interface Dashboard {
  latestMarsImage: MediaItem | null;
  apolloTotalResults: number;
  keywordDistribution: {
    keyword: string;
    byMediaType: {
      image: number;
      video: number;
      audio: number;
    };
  };
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}
