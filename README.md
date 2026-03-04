# NASA Image & Video Library API

A REST API built on top of the [NASA Image and Video Library](https://images.nasa.gov). It normalizes NASA's responses, adds filtering/pagination, and exposes a few analytics endpoints that aggregate data across multiple NASA API calls.

Built with **Fastify** and **TypeScript**.

---

## Setup

**Requirements:** Node.js 18+, npm

```bash
npm install
cp .env.example .env
```

The `.env` file just needs three values (defaults work fine):

```
PORT=3000
NASA_API_BASE_URL=https://images-api.nasa.gov
CACHE_TTL=300
```

```bash
npm run dev      # development with hot reload
npm run build    # compile TypeScript
npm start        # run compiled output
npm test         # run tests
```

---

## Trying it out

Once the server is running on port 3000, you can hit the endpoints directly from your terminal:

```bash
# Search for Mars images from the 90s
curl "http://localhost:3000/media/search?q=mars&mediaType=image&yearStart=1990&yearEnd=1999&pageSize=3"

# Get full detail on a specific asset
curl "http://localhost:3000/media/PIA00405"

# See what NASA published in 1969
curl "http://localhost:3000/analytics/year/1969"

# Explore everything tagged "hubble"
curl "http://localhost:3000/analytics/topic/hubble"

# Dashboard overview
curl "http://localhost:3000/dashboard?keyword=saturn"
```

---

## API Endpoints

### `GET /health`

```bash
curl http://localhost:3000/health
```

```json
{ "status": "ok", "timestamp": "2024-01-15T12:00:00.000Z" }
```

---

### `GET /media/search`

Searches NASA's media library and returns normalized, paginated results.

| Parameter   | Type   | Required | Description |
|-------------|--------|----------|-------------|
| `q`         | string | No       | Search query |
| `mediaType` | string | No       | `image`, `video`, or `audio` |
| `yearStart` | string | No       | 4-digit year |
| `yearEnd`   | string | No       | 4-digit year |
| `keywords`  | string | No       | Comma-separated keywords |
| `page`      | number | No       | Default: `1` |
| `pageSize`  | number | No       | Default: `20`, max: `100` |

```bash
curl "http://localhost:3000/media/search?q=apollo&mediaType=image&yearStart=1969&yearEnd=1972&pageSize=5"
```

```json
{
  "data": [
    {
      "nasaId": "as11-40-5931",
      "title": "Apollo 11 Mission image - Astronaut Edwin Aldrin",
      "description": "Astronaut Edwin E. Aldrin Jr., Lunar Module pilot...",
      "mediaType": "image",
      "dateCreated": "1969-07-20T00:00:00Z",
      "center": "JSC",
      "keywords": ["Apollo 11", "Moon landing", "Aldrin"],
      "photographer": "Neil A. Armstrong",
      "thumbnailUrl": "https://images-assets.nasa.gov/image/as11-40-5931/as11-40-5931~thumb.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 5,
    "total": 342,
    "totalPages": 69,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### `GET /media/:nasa_id`

Returns full detail for a single item. Hits `/search`, `/asset`, and `/metadata` from NASA in parallel and combines everything into one response.

```bash
curl http://localhost:3000/media/as11-40-5931
```

```json
{
  "nasaId": "as11-40-5931",
  "title": "Apollo 11 Mission image - Astronaut Edwin Aldrin",
  "mediaType": "image",
  "dateCreated": "1969-07-20T00:00:00Z",
  "center": "JSC",
  "keywords": ["Apollo 11", "Moon landing"],
  "photographer": "Neil A. Armstrong",
  "thumbnailUrl": "https://images-assets.nasa.gov/image/as11-40-5931/as11-40-5931~thumb.jpg",
  "location": null,
  "assetUrls": [
    "https://images-assets.nasa.gov/image/as11-40-5931/as11-40-5931~orig.jpg",
    "https://images-assets.nasa.gov/image/as11-40-5931/as11-40-5931~large.jpg",
    "https://images-assets.nasa.gov/image/as11-40-5931/as11-40-5931~thumb.jpg"
  ],
  "metadata": {
    "Center": "JSC",
    "Photographer": "Neil A. Armstrong"
  }
}
```

Returns `404` if the NASA ID doesn't exist.

---

### `GET /analytics/year/:year`

Breakdown of NASA's archive for a specific year — total count, split by media type, and top 5 keywords across results.

```bash
curl http://localhost:3000/analytics/year/1969
```

```json
{
  "year": 1969,
  "totalResults": 1842,
  "byMediaType": {
    "image": 87,
    "video": 12,
    "audio": 1
  },
  "topKeywords": [
    { "keyword": "apollo 11", "count": 34 },
    { "keyword": "moon", "count": 28 },
    { "keyword": "astronaut", "count": 21 },
    { "keyword": "nasa", "count": 19 },
    { "keyword": "lunar module", "count": 15 }
  ]
}
```

Returns `400` for years outside 1900–present.

---

### `GET /analytics/topic/:keyword`

Stats for a given topic: total results, oldest and newest matching items, and media type breakdown.

```bash
curl http://localhost:3000/analytics/topic/hubble
```

```json
{
  "keyword": "hubble",
  "totalResults": 4821,
  "oldestItem": {
    "nasaId": "GSFC_19890001",
    "title": "Hubble Space Telescope Pre-Launch",
    "mediaType": "image",
    "dateCreated": "1989-01-01T00:00:00Z",
    "center": "GSFC",
    "keywords": ["Hubble", "telescope"],
    "photographer": null,
    "thumbnailUrl": "https://images-assets.nasa.gov/image/GSFC_19890001/GSFC_19890001~thumb.jpg"
  },
  "newestItem": {
    "nasaId": "GSFC_20240512",
    "title": "Hubble Captures New Galaxy Image",
    "mediaType": "image",
    "dateCreated": "2024-05-12T00:00:00Z",
    "center": "GSFC",
    "keywords": ["Hubble", "galaxy"],
    "photographer": null,
    "thumbnailUrl": "https://images-assets.nasa.gov/image/GSFC_20240512/GSFC_20240512~thumb.jpg"
  },
  "byMediaType": {
    "image": 74,
    "video": 23,
    "audio": 3
  }
}
```

---

### `GET /dashboard`

Fires three NASA searches at once and returns a combined snapshot: the latest Mars image, total Apollo result count, and media type breakdown for a keyword of your choice.

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `keyword` | string | No       | Defaults to `Earth` |

```bash
curl "http://localhost:3000/dashboard?keyword=saturn"
```

```json
{
  "latestMarsImage": {
    "nasaId": "PIA26234",
    "title": "Mars Perseverance Sol 1234",
    "mediaType": "image",
    "dateCreated": "2024-06-01T00:00:00Z",
    "center": "JPL-Caltech",
    "keywords": ["Mars", "Perseverance"],
    "photographer": null,
    "thumbnailUrl": "https://images-assets.nasa.gov/image/PIA26234/PIA26234~thumb.jpg"
  },
  "apolloTotalResults": 11823,
  "keywordDistribution": {
    "keyword": "saturn",
    "byMediaType": {
      "image": 81,
      "video": 14,
      "audio": 5
    }
  }
}
```

---

## Design Decisions

### Why Fastify

I went with Fastify over Express mainly for the performance and the TypeScript support. Fastify's plugin system also made it easy to keep things like error handling and CORS isolated rather than scattered through middleware. It felt like the right fit for a project that's mostly doing external API calls and data transformation.

### Project structure

```
src/
  controllers/   # handles request/response, nothing else
  services/      # business logic and data transformation
  routes/        # just wires URLs to controllers
  schemas/       # Zod validation for inputs
  types/         # TypeScript types for our API and NASA's API
  utils/         # cache, errors, pagination
  plugins/       # global error handler
  config/        # env config in one place
```

Controllers don't touch NASA directly — they call services. Services don't know about HTTP. This keeps each layer easy to test in isolation, which is why the tests can mock at the service boundary without spinning up real servers or hitting NASA.

### Caching

Every NASA API call goes through an in-memory TTL cache (5 minutes by default). Mostly this is just to be a good citizen — if someone searches "mars" ten times in a row, there's no reason to make ten identical requests to NASA. It also makes the app noticeably faster on repeated queries.

In production you'd swap this out for Redis so the cache works across multiple instances, but for this project in-memory is fine.

### Parallel requests

`/media/:nasa_id` and `/dashboard` both make multiple NASA API calls using `Promise.all`. The detail endpoint hits `/search`, `/asset`, and `/metadata` at the same time instead of one after another — cuts the response time roughly by 3x.

### Trade-offs

**Analytics sample size** — the year and topic endpoints only sample the first 100 results from NASA. Getting fully accurate keyword distributions would require paginating through everything, which adds a lot of latency for marginal gain. 100 results is enough to give a reasonable picture.

**No database** — everything is fetched live from NASA and cached in memory. Simpler to run and deploy, but it means there's no way to store user data or serve requests when NASA is down.

**Metadata passthrough** — the detail endpoint returns NASA's metadata blob as-is rather than mapping individual fields. The metadata structure varies a lot between items, so trying to type it all out felt like diminishing returns.

### What I'd improve with more time

- Move caching to Redis for multi-instance support
- Paginate analytics fully instead of sampling 100 results
- Add a `/media/:nasa_id/captions` endpoint using NASA's captions API
- Better observability — structured logs with request IDs, response time tracking
