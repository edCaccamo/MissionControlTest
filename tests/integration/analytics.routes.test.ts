import { buildApp } from "../../src/app";
import { FastifyInstance } from "fastify";
import { NasaSearchItem } from "../../src/types/nasa.types";
import { NasaApiError } from "../../src/utils/errors";

jest.mock("../../src/services/nasa.service", () => ({
  nasaService: {
    search: jest.fn(),
    getAsset: jest.fn(),
    getMetadata: jest.fn(),
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
        keywords: overrides.keywords ?? ["test"],
      },
    ],
    links: [{ href: "http://example.com/thumb.jpg", rel: "preview" }],
  };
}

let app: FastifyInstance;

beforeAll(async () => {
  app = buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Analytics Routes", () => {
  describe("GET /analytics/year/:year", () => {
    it("should return year summary for a valid year", async () => {
      const items = [
        buildMockItem({ media_type: "image", keywords: ["mars", "rover"] }),
        buildMockItem({ media_type: "video", keywords: ["nasa"] }),
      ];
      mockedNasa.search.mockResolvedValue(buildMockResponse(items, 200));

      const response = await app.inject({
        method: "GET",
        url: "/analytics/year/2020",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.year).toBe(2020);
      expect(body.totalResults).toBe(200);
      expect(body.byMediaType.image).toBe(1);
      expect(body.byMediaType.video).toBe(1);
      expect(body.topKeywords).toBeDefined();
    });

    it("should return 400 for a non-numeric year", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/analytics/year/abc",
      });

      expect(response.statusCode).toBe(400);
    });

    it("should return 400 for a year out of valid range", async () => {
      mockedNasa.search.mockResolvedValue(buildMockResponse([], 0));

      const response = await app.inject({
        method: "GET",
        url: "/analytics/year/1800",
      });

      expect(response.statusCode).toBe(400);
    });

    it("should return 400 for a partial year like 3-digit input", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/analytics/year/202",
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /analytics/topic/:keyword", () => {
    it("should return topic insight for a valid keyword", async () => {
      const items = [
        buildMockItem({ nasa_id: "OLD_001", date_created: "1970-01-01T00:00:00Z", media_type: "image" }),
        buildMockItem({ nasa_id: "NEW_001", date_created: "2024-01-01T00:00:00Z", media_type: "video" }),
      ];
      mockedNasa.search.mockResolvedValue(buildMockResponse(items, 999));

      const response = await app.inject({
        method: "GET",
        url: "/analytics/topic/mars",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.keyword).toBe("mars");
      expect(body.totalResults).toBe(999);
      expect(body.oldestItem?.nasaId).toBe("OLD_001");
      expect(body.newestItem?.nasaId).toBe("NEW_001");
      expect(body.byMediaType).toBeDefined();
    });

    it("should return 400 for a whitespace-only keyword", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/analytics/topic/%20",
      });

      expect(response.statusCode).toBe(400);
    });

    it("should handle NASA API errors gracefully", async () => {
      mockedNasa.search.mockRejectedValue(new NasaApiError("NASA API down"));

      const response = await app.inject({
        method: "GET",
        url: "/analytics/topic/mars",
      });

      expect(response.statusCode).toBe(502);
    });
  });
});

describe("Dashboard Routes", () => {
  describe("GET /dashboard", () => {
    it("should return combined dashboard data with default keyword", async () => {
      const marsItem = buildMockItem({ nasa_id: "MARS_001", media_type: "image" });

      // Dashboard fires 3 parallel searches: Mars images, Apollo, and the keyword
      mockedNasa.search
        .mockResolvedValueOnce(buildMockResponse([marsItem], 1))               // Mars
        .mockResolvedValueOnce(buildMockResponse([], 11823))                   // Apollo
        .mockResolvedValueOnce(buildMockResponse([                             // keyword
          buildMockItem({ media_type: "image" }),
          buildMockItem({ media_type: "image" }),
          buildMockItem({ media_type: "video" }),
        ], 3));

      const response = await app.inject({
        method: "GET",
        url: "/dashboard",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.latestMarsImage?.nasaId).toBe("MARS_001");
      expect(body.apolloTotalResults).toBe(11823);
      expect(body.keywordDistribution.keyword).toBe("Earth");
      expect(body.keywordDistribution.byMediaType.image).toBe(2);
      expect(body.keywordDistribution.byMediaType.video).toBe(1);
    });

    it("should use the custom keyword when provided via query param", async () => {
      mockedNasa.search
        .mockResolvedValueOnce(buildMockResponse([], 0))   // Mars
        .mockResolvedValueOnce(buildMockResponse([], 0))   // Apollo
        .mockResolvedValueOnce(buildMockResponse([         // keyword
          buildMockItem({ media_type: "image" }),
        ], 1));

      const response = await app.inject({
        method: "GET",
        url: "/dashboard?keyword=Jupiter",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.keywordDistribution.keyword).toBe("Jupiter");
    });

    it("should return null latestMarsImage when NASA returns no Mars results", async () => {
      mockedNasa.search
        .mockResolvedValueOnce(buildMockResponse([], 0))  // Mars — empty
        .mockResolvedValueOnce(buildMockResponse([], 0))  // Apollo
        .mockResolvedValueOnce(buildMockResponse([], 0)); // keyword

      const response = await app.inject({
        method: "GET",
        url: "/dashboard",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.latestMarsImage).toBeNull();
    });
  });
});
