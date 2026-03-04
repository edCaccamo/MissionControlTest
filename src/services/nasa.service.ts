// Single integration point for all NASA API calls.

import axios, { AxiosInstance } from "axios";
import { config } from "../config";
import { NasaApiError } from "../utils/errors";
import { appCache } from "../utils/cache";
import {
  NasaSearchResponse,
  NasaAssetResponse,
  NasaMetadataResponse,
} from "../types/nasa.types";

class NasaService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.nasa.baseUrl,
      timeout: 15000, // 15 second timeout — NASA can be slow
    });
  }

  /** GET /search */
  async search(params: {
    q?: string;
    center?: string;
    description?: string;
    keywords?: string;
    media_type?: string;
    nasa_id?: string;
    page?: number;
    page_size?: number;
    title?: string;
    year_start?: string;
    year_end?: string;
  }): Promise<NasaSearchResponse> {
    const cacheKey = `search:${JSON.stringify(params)}`;
    const cached = appCache.get<NasaSearchResponse>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<NasaSearchResponse>("/search", {
        params,
      });
      appCache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new NasaApiError(
        `NASA search failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /** GET /asset/{nasa_id} */
  async getAsset(nasaId: string): Promise<NasaAssetResponse> {
    const cacheKey = `asset:${nasaId}`;
    const cached = appCache.get<NasaAssetResponse>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<NasaAssetResponse>(
        `/asset/${nasaId}`
      );
      appCache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new NasaApiError(
        `NASA asset fetch failed for ${nasaId}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /** GET /metadata/{nasa_id} — returns a redirect to the actual metadata JSON */
  async getMetadata(nasaId: string): Promise<Record<string, unknown> | null> {
    const cacheKey = `metadata:${nasaId}`;
    const cached = appCache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<NasaMetadataResponse>(
        `/metadata/${nasaId}`
      );
      const metadataResponse = await axios.get(response.data.location);
      const metadata = metadataResponse.data;
      appCache.set(cacheKey, metadata);
      return metadata;
    } catch (error) {
      console.warn(`Metadata not available for ${nasaId}`);
      return null;
    }
  }
}

export const nasaService = new NasaService();
