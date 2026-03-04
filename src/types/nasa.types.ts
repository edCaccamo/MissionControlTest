
export interface NasaSearchResponse {
  collection: {
    version: string;
    href: string;
    items: NasaSearchItem[];
    metadata: {
      total_hits: number;
    };
    links?: NasaCollectionLink[];
  };
}

export interface NasaSearchItem {
  href: string; // URL to the asset manifest
  data: NasaItemData[];
  links?: NasaItemLink[];
}

export interface NasaItemData {
  center: string;
  title: string;
  nasa_id: string;
  date_created: string;
  media_type: "image" | "video" | "audio";
  description?: string;
  description_508?: string;
  keywords?: string[];
  photographer?: string;
  secondary_creator?: string;
  location?: string;
  album?: string[];
}

export interface NasaItemLink {
  href: string;
  rel: string;
  render?: string;
}

export interface NasaCollectionLink {
  rel: string;
  prompt: string;
  href: string;
}

// The /asset/{nasa_id} endpoint returns a list of available files
export interface NasaAssetResponse {
  collection: {
    version: string;
    href: string;
    items: {
      href: string;
    }[];
  };
}

// The /metadata/{nasa_id} endpoint returns a URL to a JSON metadata file
export interface NasaMetadataResponse {
  location: string;
}
