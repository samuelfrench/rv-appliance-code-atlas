import { describe, expect, it } from "vitest";
import corpus from "../data/corpus.json";
import { loadCorpus } from "./corpusLoader";

describe("corpus loader", () => {
  it("fetches and parses the emitted corpus asset", async () => {
    const requested: string[] = [];
    const loaded = await loadCorpus("/assets/corpus.json", async (input) => {
      requested.push(String(input));
      return new Response(JSON.stringify(corpus), { status: 200 });
    });

    expect(requested).toEqual(["/assets/corpus.json"]);
    expect(loaded.entries).toHaveLength(corpus.entries.length);
    expect(loaded.symptoms).toHaveLength(corpus.symptoms.length);
    expect(loaded.sources).toHaveLength(corpus.sources.length);
  });

  it("throws a useful error when the corpus asset cannot be loaded", async () => {
    await expect(
      loadCorpus("/assets/missing-corpus.json", async () => new Response("missing", { status: 404 })),
    ).rejects.toThrow("Unable to load corpus asset");
  });
});
