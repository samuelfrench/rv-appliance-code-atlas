import type { Corpus } from "./corpus";

type Fetcher = (input: string) => Promise<Response>;

export async function loadCorpus(corpusUrl: string, fetcher: Fetcher = fetch): Promise<Corpus> {
  const response = await fetcher(corpusUrl);
  if (!response.ok) {
    throw new Error(`Unable to load corpus asset: ${response.status}`);
  }
  return (await response.json()) as Corpus;
}
