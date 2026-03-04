import { Cache } from "../../src/utils/cache";

describe("Cache", () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache(60); // 60 second TTL
  });

  it("should return null for missing keys", () => {
    expect(cache.get("nonexistent")).toBeNull();
  });

  it("should store and retrieve values", () => {
    cache.set("key1", { data: "hello" });
    expect(cache.get("key1")).toEqual({ data: "hello" });
  });

  it("should return null for expired entries", () => {
    const shortCache = new Cache(0);
    shortCache.set("key1", "value");
    expect(shortCache.get("key1")).toBeNull();
  });

  it("should clear all entries", () => {
    cache.set("key1", "a");
    cache.set("key2", "b");
    expect(cache.size).toBe(2);

    cache.clear();
    expect(cache.size).toBe(0);
  });

  it("should allow custom TTL per entry", () => {
    cache.set("short", "value", 0); // expires immediately
    cache.set("long", "value", 9999);

    expect(cache.get("short")).toBeNull();
    expect(cache.get("long")).toBe("value");
  });
});
