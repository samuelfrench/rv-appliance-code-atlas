// Reads every data file the site is built from.
import fs from "node:fs";
import path from "node:path";

export function loadSiteData(root) {
  const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
  const notesDir = path.join(root, "src/data/topic-notes");
  const topicNotes = Object.fromEntries(
    fs
      .readdirSync(notesDir)
      .filter((file) => file.endsWith(".json"))
      .sort()
      .map((file) => {
        const notes = JSON.parse(fs.readFileSync(path.join(notesDir, file), "utf8"));
        return [notes.topic, notes];
      }),
  );
  return {
    corpus: read("src/data/corpus.json"),
    familiesData: read("src/data/families.json"),
    hubsData: read("src/data/guide-hubs.json"),
    topicNotes,
  };
}
