import { getYearSummary, getTopicInsight } from "../../src/services/analytics.service";
import { BadRequestError } from "../../src/utils/errors";
import { NasaSearchItem } from "../../src/types/nasa.types";

jest.mock("../../src/services/nasa.service", () => ({
  nasaService: {
    search: jest.fn(),
  },
}));

import { nasaService } from "../../src/services/nasa.service";

const mockedNasa = nasaService as jest.Mocked<typeof nasaService>;

function buildMockResponse(items: NasaSearchItem[], totalHits: number) {
  return {
    collection: {
      version: "1.0",
      href: "http://example.com",
      items,
      metadata: { total_hits: totalHits },
    },
  };
}

function buildMockItem(overrides: {
  nasa_id?: string;
  media_type?: "image" | "video" | "audio";
  date_created?: string;
  keywords?: string[];
} = {}): NasaSearchItem {
  return {
    href: "http://example.com/asset",
    data: [
      {
        nasa_id: overrides.nasa_id ?? "TEST_001",
        title: "Test Item",
        media_type: overrides.media_type ?? "image",
        date_created: overrides.date_created ?? "2020-01-01T00:00:00Z",
        center: "JSC",
        description: "A test description",
        keywords: overrides.keywords ?? [],
      },
    ],
    links: [{ href: "http://example.com/thumb.jpg", rel: "preview" }],
  };
}

describe("Analytics Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getYearSummary", () => {
    it("should return year summary with media type breakdown", async () => {
      const items = [
        buildMockItem({ media_type: "image", keywords: ["mars", "rover"] }),
        buildMockItem({ media_type: "image", keywords: ["mars", "nasa"] }),
        buildMockItem({ media_type: "video", keywords: ["moon"] }),
      ];
      mockedNasa.search.mockResolvedValue(buildMockResponse(items, 150));

      const result = await getYearSummary(2020);

      expect(result.year).toBe(2020);
      expect(result.totalResults).toBe(150);
      expect(result.byMediaType.image).toBe(2);
      expect(result.byMediaType.video).toBe(1);
      expect(result.byMediaType.audio).toBe(0);
      expect(result.topKeywords[0].keyword).toBe("mars");
      expect(result.topKeywords[0].count).toBe(2);
    });

    it("should call NASA search with correct year range params", async () => {
      mockedNasa.search.mockResolvedValue(buildMockResponse([], 0));

      await getYearSummary(2015);

      expect(mockedNasa.search).toHaveBeenCalledWith({
        year_start: "2015",
        year_end: "2015",
        page_size: 100,
      });
    });

    it("should return zero counts and empty keywords when there are no results", async () => {
      mockedNasa.search.mockResolvedValue(buildMockResponse([], 0));

      const result = await getYearSummary(2020);

      expect(result.totalResults).toBe(0);
      expect(result.byMediaType).toEqual({ image: 0, video: 0, audio: 0 });
      expect(result.topKeywords).toHaveLength(0);
    });

    it("should throw BadRequestError for a year below 1900", async () => {
      await expect(getYearSummary(1800)).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError for a future year", async () => {
      await expect(getYearSummary(9999)).rejects.toThrow(BadRequestError);
    });
  });

  describe("getTopicInsight", () => {
    it("should return topic insight with correct oldest and newest items", async () => {
      const items = [
        buildMockItem({ nasa_id: "MID_001", date_created: "2000-01-01T00:00:00Z", media_type: "image" }),
        buildMockItem({ nasa_id: "OLD_001", date_created: "1970-06-01T00:00:00Z", media_type: "image" }),
        buildMockItem({ nasa_id: "NEW_001", date_created: "2024-01-01T00:00:00Z", media_type: "video" }),
      ];
      mockedNasa.search.mockResolvedValue(buildMockResponse(items, 500));

      const result = await getTopicInsight("hubble");

      expect(result.keyword).toBe("hubble");
      expect(result.totalResults).toBe(500);
      expect(result.oldestItem?.nasaId).toBe("OLD_001");
      expect(result.newestItem?.nasaId).toBe("NEW_001");
      expect(result.byMediaType.image).toBe(2);
      expect(result.byMediaType.video).toBe(1);
    });

    it("should return null oldest and newest when there are no results", async () => {
      mockedNasa.search.mockResolvedValue(buildMockResponse([], 0));

      const result = await getTopicInsight("obscure-topic");

      expect(result.totalResults).toBe(0);
      expect(result.oldestItem).toBeNull();
      expect(result.newestItem).toBeNull();
    });

    it("should throw BadRequestError for an empty keyword", async () => {
      await expect(getTopicInsight("")).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError for a whitespace-only keyword", async () => {
      await expect(getTopicInsight("   ")).rejects.toThrow(BadRequestError);
    });
  });
});
