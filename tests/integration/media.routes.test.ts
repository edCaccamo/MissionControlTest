import { buildApp } from "../../src/app";
import { FastifyInstance } from "fastify";
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

describe("Media Routes", () => {
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

  describe("GET /media/search", () => {
    it("should return paginated results for a valid search", async () => {
      mockedNasa.search.mockResolvedValue({
        collection: {
          version: "1.0",
          href: "http://example.com",
          items: [
            {
              href: "http://example.com/asset",
              data: [
                {
                  nasa_id: "PIA12345",
                  title: "Mars Rover Image",
                  media_type: "image",
                  date_created: "2023-01-15T00:00:00Z",
                  center: "JPL",
                  description: "A test image",
                  keywords: ["Mars", "Rover"],
                },
              ],
              links: [
                {
                  href: "http://example.com/thumb.jpg",
                  rel: "preview",
                  render: "image",
                },
              ],
            },
          ],
          metadata: { total_hits: 1 },
        },
      });

      const response = await app.inject({
        method: "GET",
        url: "/media/search?q=mars",
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].nasaId).toBe("PIA12345");
      expect(body.data[0].title).toBe("Mars Rover Image");
      expect(body.pagination).toBeDefined();
      expect(body.pagination.total).toBe(1);
    });

    it("should handle invalid mediaType gracefully", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/media/search?mediaType=invalid",
      });

      expect(response.statusCode).toBe(400);
    });

    it("should handle NASA API errors gracefully", async () => {
      mockedNasa.search.mockRejectedValue(new NasaApiError("NASA API down"));

      const response = await app.inject({
        method: "GET",
        url: "/media/search?q=test",
      });

      expect(response.statusCode).toBe(502);
    });
  });

  describe("GET /health", () => {
    it("should return ok status", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.status).toBe("ok");
    });
  });
});
