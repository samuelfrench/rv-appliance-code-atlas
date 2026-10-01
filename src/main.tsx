import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ClipboardList, FileSearch, Gauge, Printer, Search } from "lucide-react";
import corpusUrl from "./data/corpus.json?url";
import {
  buildSearchIndex,
  buildSymptomSearchIndex,
  lookupEntries,
  lookupSymptomGuides,
  slugPathForEntry,
  slugPathForSymptom,
  type Corpus,
  type CorpusEntry,
  type SymptomGuide,
} from "./lib/corpus";
import { loadCorpus } from "./lib/corpusLoader";
import { loadSiteIndex, lookupFamilies, type FamilySummary, type SiteIndex } from "./lib/siteIndex";
import "./styles.css";

// Detail pages are prerendered static HTML. The app only powers the homepage search box
// (mounted into #search-app) and the not-found page for unknown URLs.

type PreparedCorpus = {
  corpus: Corpus;
  searchIndex: ReturnType<typeof buildSearchIndex>;
  symptomSearchIndex: ReturnType<typeof buildSymptomSearchIndex>;
  siteIndex: SiteIndex;
};

type AppState =
  | { status: "loading" }
  | { status: "ready"; data: PreparedCorpus }
  | { status: "error"; message: string };

type Capture = {
  brand: string;
  model: string;
  part: string;
  notes: string;
};

type Result =
  | { kind: "family"; family: FamilySummary }
  | { kind: "entry"; entry: CorpusEntry }
  | { kind: "symptom"; symptom: SymptomGuide };

const emptyCapture: Capture = { brand: "", model: "", part: "", notes: "" };
const quickPicks = ["Onan 36", "Norcold no FL", "Furrion E3", "Low voltage"];
// Shown before the visitor types: one widely searched code per appliance type.
const starterSlugs = [
  "norcold-1200-no-fl",
  "onan-code-36-engine-stopped",
  "dometic-rm10-display-fault-08-level-refrigerator-reset",
  "suburban-furnace-lock-out",
  "suburban-water-heater-reset-light",
  "lippert-ground-control-excess-angle",
  "furrion-10-6-refrigerator-e3",
  "dometic-ccc2-e1",
];

function prepareCorpus(corpus: Corpus, siteIndex: SiteIndex): PreparedCorpus {
  return {
    corpus,
    searchIndex: buildSearchIndex(corpus),
    symptomSearchIndex: buildSymptomSearchIndex(corpus),
    siteIndex,
  };
}

function loadCapture(): Capture {
  try {
    const raw = window.localStorage.getItem("rv-atlas-capture");
    return raw ? { ...emptyCapture, ...JSON.parse(raw) } : emptyCapture;
  } catch {
    return emptyCapture;
  }
}

function initialQuery() {
  try {
    return new URLSearchParams(window.location.search).get("q") ?? "";
  } catch {
    return "";
  }
}

function useCorpus() {
  const [state, setState] = useState<AppState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    Promise.all([loadCorpus(corpusUrl), loadSiteIndex("/site-index.json")])
      .then(([loadedCorpus, siteIndex]) => {
        if (active) setState({ status: "ready", data: prepareCorpus(loadedCorpus, siteIndex) });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Unable to load corpus asset.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}

function SearchApp() {
  const state = useCorpus();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (query.trim()) url.searchParams.set("q", query);
      else url.searchParams.delete("q");
      window.history.replaceState(null, "", url);
    } catch {
      // URL sync is a convenience only.
    }
  }, [query]);

  return (
    <>
      <div className="hero-panel" aria-label="Search RV appliance codes">
        <label className="search-label" htmlFor="lookup">
          Search by brand, model, code, or symptom
        </label>
        <div className="searchbox">
          <Search aria-hidden="true" />
          <input
            id="lookup"
            role="searchbox"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try: Norcold no FL, Onan 36, Furrion E3"
            autoComplete="off"
          />
        </div>
        <div className="quick-picks" aria-label="Quick searches">
          {quickPicks.map((item) => (
            <button type="button" key={item} onClick={() => setQuery(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>
      {state.status === "ready" ? (
        <Results data={state.data} query={query} />
      ) : (
        <section className="results-band" aria-label="Lookup results">
          <p className="muted">{state.status === "loading" ? "Loading the verified code list…" : state.message}</p>
        </section>
      )}
    </>
  );
}

function Results({ data, query }: { data: PreparedCorpus; query: string }) {
  const { searchIndex, symptomSearchIndex, siteIndex } = data;
  const results = useMemo<Result[]>(() => {
    if (!query.trim()) {
      return starterSlugs
        .map((slug) => searchIndex.find((entry) => entry.slug === slug))
        .filter((entry): entry is (typeof searchIndex)[number] => Boolean(entry))
        .map((entry) => ({ kind: "entry" as const, entry }));
    }

    const entryResults = lookupEntries(searchIndex, query).map((entry) => ({ kind: "entry" as const, entry }));

    const familyResults = lookupFamilies(siteIndex.families, query)
      .slice(0, 2)
      .map((family) => ({ kind: "family" as const, family }));
    const symptomResults = lookupSymptomGuides(symptomSearchIndex, query).map((symptom) => ({
      kind: "symptom" as const,
      symptom,
    }));

    if (isExactCodeSearch(query, entryResults[0]?.entry)) {
      return [entryResults[0], ...familyResults, ...symptomResults.slice(0, 4), ...entryResults.slice(1)].slice(0, 12);
    }

    return [...familyResults, ...symptomResults.slice(0, 4), ...entryResults].slice(0, 12);
  }, [query, searchIndex, symptomSearchIndex, siteIndex]);

  return (
    <section className="results-band" aria-label="Lookup results">
      <SectionHeader icon={<FileSearch />} eyebrow="Lookup" title={query ? `Matches for "${query}"` : "Start with common searches"} />
      <div className="result-grid">
        {results.map((result) => {
          if (result.kind === "family") return <FamilyCard key={`family-${result.family.slug}`} family={result.family} />;
          if (result.kind === "entry") return <EntryCard key={`entry-${result.entry.id}`} entry={result.entry} siteIndex={siteIndex} />;
          return <SymptomResultCard key={`symptom-${result.symptom.id}`} symptom={result.symptom} />;
        })}
      </div>
      {query.trim() && !results.length ? (
        <p className="muted">
          No verified match. This atlas only lists codes found in manufacturer documentation; check the manual for your exact
          model.
        </p>
      ) : null}
    </section>
  );
}

function isExactCodeSearch(query: string, entry?: CorpusEntry) {
  if (!entry) return false;
  const queryTerms = new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const codeTerms = entry.code.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const compactQuery = query.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const compactCode = entry.code.toLowerCase().replace(/[^a-z0-9]+/g, "");

  return (
    codeTerms.length > 0 &&
    (codeTerms.every((term) => queryTerms.has(term)) ||
      (codeTerms.length > 1 && compactCode.length > 0 && compactQuery.includes(compactCode)))
  );
}

function Header() {
  return (
    <header className="site-header">
      <a href="/" className="mark" aria-label="RV Appliance Code Atlas home">
        <Gauge aria-hidden="true" />
        <span>RV Atlas</span>
      </a>
      <nav aria-label="Primary navigation">
        <a href="/#appliances">Appliances</a>
        <a href="/guides/">Guides</a>
        <a href="/#search">Search</a>
      </nav>
    </header>
  );
}

function SectionHeader({ icon, eyebrow, title }: { icon: React.ReactNode; eyebrow: string; title: string }) {
  return (
    <div className="section-header">
      <div className="section-icon">{icon}</div>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

function FamilyCard({ family }: { family: FamilySummary }) {
  return (
    <a className="entry-card family-card" href={family.path} aria-label={`Code table ${family.name}`}>
      <div className="entry-top">
        <span>{family.brand}</span>
        <strong>{family.codeCount} codes</strong>
      </div>
      <h3>{family.name}</h3>
      <p>Full code table: every code listed in the manufacturer documentation for these models.</p>
      <small>{family.models.slice(0, 8).join(", ")}</small>
    </a>
  );
}

function EntryCard({ entry, siteIndex }: { entry: CorpusEntry; siteIndex: SiteIndex }) {
  const href = siteIndex.entryPaths[entry.slug] ?? slugPathForEntry(entry);
  return (
    <a className="entry-card" href={href} aria-label={`${entry.brand} ${entry.code} ${entry.equipmentType}`}>
      <div className="entry-top">
        <span>{entry.brand}</span>
        <strong>{entry.code}</strong>
      </div>
      <h3>
        {entry.brand} {entry.equipmentType.toLowerCase()} {entry.code}
      </h3>
      <p>{entry.plainMeaning}</p>
      <small>{entry.modelFamilies.join(", ")}</small>
    </a>
  );
}

function SymptomResultCard({ symptom }: { symptom: SymptomGuide }) {
  return (
    <a className="entry-card symptom-result-card" href={slugPathForSymptom(symptom)} aria-label={`Symptom guide ${symptom.title}`}>
      <div className="entry-top">
        <span>Symptom guide</span>
        <strong>Guide</strong>
      </div>
      <h3>{symptom.title}</h3>
      <p>{symptom.summary}</p>
      <small>Owner-safe checklist and official source</small>
    </a>
  );
}

function ToolsBand() {
  const [capture, setCapture] = useState<Capture>(loadCapture);
  const saveCapture = () => {
    try {
      window.localStorage.setItem("rv-atlas-capture", JSON.stringify(capture));
    } catch {
      // Storage can be unavailable in private browsing; the form still works for printing.
    }
  };

  return (
    <section id="tools" className="tools-band" aria-label="Owner tools">
      <SectionHeader icon={<ClipboardList />} eyebrow="Before service" title="Model finder and part capture" />
      <div className="tools-layout">
        <div className="tool-panel">
          <h3>Where to look first</h3>
          <ol className="finder-list">
            <li>Open the exterior appliance access panel only if it is safe and tool-free.</li>
            <li>Photograph the model/serial label without removing covers.</li>
            <li>Capture the exact display code, power source, LP status, and battery voltage if visible.</li>
            <li>Do not remove gas, electrical, rooftop, generator, or control-board covers.</li>
          </ol>
          <button type="button" className="print-button" onClick={() => window.print()}>
            <Printer aria-hidden="true" />
            Print checklist
          </button>
        </div>
        <form className="capture-form" onSubmit={(event) => event.preventDefault()}>
          <label>
            Brand
            <input value={capture.brand} onChange={(event) => setCapture({ ...capture, brand: event.target.value })} />
          </label>
          <label>
            Model number
            <input value={capture.model} onChange={(event) => setCapture({ ...capture, model: event.target.value })} />
          </label>
          <label>
            Part or board number
            <input value={capture.part} onChange={(event) => setCapture({ ...capture, part: event.target.value })} />
          </label>
          <label>
            Notes
            <textarea value={capture.notes} onChange={(event) => setCapture({ ...capture, notes: event.target.value })} />
          </label>
          <button type="button" onClick={saveCapture}>
            Save capture
          </button>
        </form>
      </div>
    </section>
  );
}

function NotFoundPage() {
  useEffect(() => {
    document.title = "Code not verified yet – RV Appliance Code Atlas";
    const robots = document.querySelector('meta[name="robots"]');
    robots?.setAttribute("content", "noindex,follow");
  }, []);

  return (
    <>
      <Header />
      <main className="detail-main">
        <article className="detail-article">
          <h1>Code not verified yet</h1>
          <p className="detail-meaning">
            This atlas rejects unsourced codes. Try the search below or check the official manual for your exact model.
          </p>
        </article>
        <SearchApp />
        <ToolsBand />
      </main>
      <Footer />
    </>
  );
}

function StandaloneHome() {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <h1>RV Appliance Code Atlas</h1>
          </div>
        </section>
        <SearchApp />
        <ToolsBand />
      </main>
      <Footer />
    </>
  );
}

function Footer() {
  return (
    <footer>
      <p>Free lookup built only from manufacturer manuals and support pages. No DIY gas, electrical, or refrigerant repair instructions.</p>
    </footer>
  );
}

const rootElement = document.getElementById("root");
const searchMount = document.getElementById("search-app");
const toolsMount = document.getElementById("tools-app");
const isHome = window.location.pathname === "/" || window.location.pathname === "/index.html";

if (rootElement && rootElement.dataset.static !== "true") {
  if (isHome && searchMount) {
    // Prerendered homepage: only the search box is interactive.
    createRoot(searchMount).render(
      <React.StrictMode>
        <SearchApp />
      </React.StrictMode>,
    );
    if (toolsMount) {
      createRoot(toolsMount).render(
        <React.StrictMode>
          <ToolsBand />
        </React.StrictMode>,
      );
    }
  } else {
    createRoot(rootElement).render(<React.StrictMode>{isHome ? <StandaloneHome /> : <NotFoundPage />}</React.StrictMode>);
  }
}
