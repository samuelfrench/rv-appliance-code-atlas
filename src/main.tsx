import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  ClipboardList,
  FileSearch,
  Gauge,
  HardHat,
  Printer,
  Search,
  Shield,
  Wrench,
} from "lucide-react";
import corpusUrl from "./data/corpus.json?url";
import {
  buildSearchIndex,
  buildSymptomSearchIndex,
  getBrandCoverage,
  getEntryBySlug,
  getSourcesForIds,
  getSymptomBySlug,
  lookupEntries,
  lookupSymptomGuides,
  slugPathForEntry,
  slugPathForSymptom,
  summarizeCorpus,
  type Corpus,
  type CorpusEntry,
  type SymptomGuide,
} from "./lib/corpus";
import { loadCorpus } from "./lib/corpusLoader";
import "./styles.css";

type PreparedCorpus = {
  corpus: Corpus;
  searchIndex: ReturnType<typeof buildSearchIndex>;
  symptomSearchIndex: ReturnType<typeof buildSymptomSearchIndex>;
  summary: ReturnType<typeof summarizeCorpus>;
  brandCoverage: ReturnType<typeof getBrandCoverage>;
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

const emptyCapture: Capture = { brand: "", model: "", part: "", notes: "" };

function prepareCorpus(corpus: Corpus): PreparedCorpus {
  return {
    corpus,
    searchIndex: buildSearchIndex(corpus),
    symptomSearchIndex: buildSymptomSearchIndex(corpus),
    summary: summarizeCorpus(corpus),
    brandCoverage: getBrandCoverage(corpus),
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

function App() {
  const [state, setState] = useState<AppState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    loadCorpus(corpusUrl)
      .then((loadedCorpus) => {
        if (active) setState({ status: "ready", data: prepareCorpus(loadedCorpus) });
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

  if (state.status === "loading") return <LoadingShell />;
  if (state.status === "error") return <LoadError message={state.message} />;

  return <ReadyApp data={state.data} />;
}

function ReadyApp({ data }: { data: PreparedCorpus }) {
  const { corpus } = data;
  const path = window.location.pathname;
  const detailMatch = path.match(/^\/codes\/([^/]+)\/?$/);
  const symptomMatch = path.match(/^\/symptoms\/([^/]+)\/?$/);

  if (detailMatch) {
    const entry = getEntryBySlug(corpus, detailMatch[1]);
    return entry ? <CodeDetail entry={entry} corpus={corpus} /> : <NotFound />;
  }

  if (symptomMatch) {
    const symptom = getSymptomBySlug(corpus, symptomMatch[1]);
    return symptom ? <SymptomDetail symptom={symptom} corpus={corpus} /> : <NotFound />;
  }

  return <Home data={data} />;
}

function Home({ data }: { data: PreparedCorpus }) {
  const { corpus, searchIndex, symptomSearchIndex, summary, brandCoverage } = data;
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const entryResults = lookupEntries(searchIndex, query).map((entry) => ({ kind: "entry" as const, entry }));
    if (!query.trim()) return entryResults.slice(0, 8);

    const symptomResults = lookupSymptomGuides(symptomSearchIndex, query).map((symptom) => ({
      kind: "symptom" as const,
      symptom,
    }));

    if (isExactCodeSearch(query, entryResults[0]?.entry)) {
      return [entryResults[0], ...symptomResults.slice(0, 4), ...entryResults.slice(1)].slice(0, 12);
    }

    return [...symptomResults.slice(0, 4), ...entryResults].slice(0, 12);
  }, [query, searchIndex, symptomSearchIndex]);

  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Source-backed RV fault-code lookup</p>
            <h1>RV Appliance Code Atlas</h1>
            <p className="hero-text">
              Look up appliance codes, model families, service boundaries, and pre-call facts before you call a mobile
              RV technician or manufacturer support.
            </p>
            <div className="hero-stats" aria-label="Corpus stats">
              <Stat value={summary.verifiedEntries} label="verified codes" />
              <Stat value={summary.totalSymptoms} label="symptom guides" />
              <Stat value={summary.totalSources} label="official sources" />
            </div>
          </div>
          <div className="hero-stack">
            <figure className="hero-image">
              <img src="/images/rv-appliance-code-atlas-hero.jpg" alt="RV service workbench with diagnostic tools" />
            </figure>
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
                {["Onan 36", "Norcold no FL", "Furrion E3", "Low voltage"].map((item) => (
                  <button type="button" key={item} onClick={() => setQuery(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="results-band" aria-label="Lookup results">
          <SectionHeader icon={<FileSearch />} eyebrow="Lookup" title={query ? `Matches for "${query}"` : "Start with common searches"} />
          <div className="result-grid">
            {results.map((result) => (
              result.kind === "entry" ? (
                <EntryCard key={`entry-${result.entry.id}`} entry={result.entry} />
              ) : (
                <SymptomResultCard key={`symptom-${result.symptom.id}`} symptom={result.symptom} />
              )
            ))}
          </div>
        </section>

        <section className="brand-band" aria-label="Brand coverage">
          <SectionHeader icon={<BadgeCheck />} eyebrow="Coverage" title="Verified first-batch brands" />
          <div className="brand-grid">
            {Object.entries(brandCoverage).map(([brand, coverage]) => (
              <a href={`#brand-${brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="brand-tile" key={brand}>
                <strong>{brand}</strong>
                <span>{coverage.verifiedEntries} verified entries</span>
                <small>{coverage.equipmentTypes.join(", ")}</small>
              </a>
            ))}
          </div>
        </section>

        <ToolsBand />
        <SymptomBand corpus={corpus} />
        <SourceBand corpus={corpus} />
        <MonetizationBand corpus={corpus} />
      </main>
      <Footer />
    </>
  );
}

function isExactCodeSearch(query: string, entry?: CorpusEntry) {
  if (!entry) return false;
  const queryTerms = new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const codeTerms = entry.code.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

  return codeTerms.length > 0 && codeTerms.every((term) => queryTerms.has(term));
}

function Header() {
  return (
    <header className="site-header">
      <a href="/" className="mark" aria-label="RV Appliance Code Atlas home">
        <Gauge aria-hidden="true" />
        <span>RV Atlas</span>
      </a>
      <nav aria-label="Primary navigation">
        <a href="#tools">Tools</a>
        <a href="#symptoms">Symptoms</a>
        <a href="#sources">Sources</a>
      </nav>
    </header>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
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

function EntryCard({ entry }: { entry: CorpusEntry }) {
  return (
    <a className="entry-card" href={slugPathForEntry(entry)} aria-label={`${entry.brand} ${entry.code} ${entry.equipmentType}`}>
      <div className="entry-top">
        <span>{entry.brand}</span>
        <strong>{entry.code}</strong>
      </div>
      <h3>
        {entry.brand} {entry.code}
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
    window.localStorage.setItem("rv-atlas-capture", JSON.stringify(capture));
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

function SymptomBand({ corpus }: { corpus: Corpus }) {
  return (
    <section id="symptoms" className="symptom-band" aria-label="Symptom guides">
      <SectionHeader icon={<Wrench />} eyebrow="Guides" title="Symptom-first paths" />
      <div className="symptom-grid">
        {corpus.symptoms.map((symptom) => (
          <a href={slugPathForSymptom(symptom)} key={symptom.id} className="symptom-link">
            <span>{symptom.title}</span>
            <small>{symptom.summary}</small>
          </a>
        ))}
      </div>
    </section>
  );
}

function SourceBand({ corpus }: { corpus: Corpus }) {
  return (
    <section id="sources" className="source-band" aria-label="Official source list">
      <SectionHeader icon={<BookOpen />} eyebrow="Evidence" title="Official sources used in this batch" />
      <div className="source-list">
        {corpus.sources.map((source) => (
          <a href={source.url} key={source.id} className="source-row" rel="noreferrer" target="_blank">
            <span>{source.brand}</span>
            <strong>{source.title}</strong>
            <small>{source.type}</small>
          </a>
        ))}
      </div>
    </section>
  );
}

function MonetizationBand({ corpus }: { corpus: Corpus }) {
  return (
    <section className="monetization-band" aria-label="Monetization readiness">
      <SectionHeader icon={<Shield />} eyebrow="Free site" title="Monetization stays disabled until traffic proves demand" />
      <p>Ad slots disabled until traffic data supports them.</p>
      <div className="monetization-grid">
        {corpus.monetization.disabledAdSlots.map((slot) => (
          <div key={slot.id}>
            <strong>{slot.id}</strong>
            <span>{slot.minimumImpressions}+ impressions needed</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CodeDetail({ entry, corpus }: { entry: CorpusEntry; corpus: Corpus }) {
  const sources = getSourcesForIds(corpus, entry.sourceIds);
  const relatedSymptoms = corpus.symptoms.filter((symptom) => entry.symptomIds.includes(symptom.id));

  return (
    <>
      <Header />
      <main className="detail-main">
        <a href="/" className="back-link">Back to lookup</a>
        <article className="detail-article">
          <p className="eyebrow">{entry.brand} {entry.equipmentType}</p>
          <h1>
            {entry.brand} {entry.code} fault code
          </h1>
          <p className="detail-meaning">{entry.plainMeaning}</p>
          <div className="safety-callout">
            <AlertTriangle aria-hidden="true" />
            <p>{entry.safetyBoundary}</p>
          </div>
          <div className="detail-columns">
            <div>
              <h2>Owner-safe notes</h2>
              <ul>{entry.ownerSafeActions.map((action) => <li key={action}>{action}</li>)}</ul>
            </div>
            <div>
              <h2>Stop boundary</h2>
              <ul>{entry.serviceOnlyActions.map((action) => <li key={action}>{action}</li>)}</ul>
            </div>
          </div>
          <section>
            <h2>Model and part capture</h2>
            <ul>{entry.partCaptureHints.map((hint) => <li key={hint}>{hint}</li>)}</ul>
          </section>
          <section>
            <h2>Related symptom guides</h2>
            <div className="inline-links">
              {relatedSymptoms.map((symptom) => (
                <a href={slugPathForSymptom(symptom)} key={symptom.id}>{symptom.title}</a>
              ))}
            </div>
          </section>
          <section>
            <h2>Official source</h2>
            <div className="source-list compact">
              {sources.map((source) => (
                <a href={source.url} key={source.id} target="_blank" rel="noreferrer" className="source-row">
                  <span>{source.brand}</span>
                  <strong>{source.title}</strong>
                  <small>{source.url}</small>
                </a>
              ))}
            </div>
          </section>
        </article>
        <MonetizationBand corpus={corpus} />
      </main>
      <Footer />
    </>
  );
}

function SymptomDetail({ symptom, corpus }: { symptom: SymptomGuide; corpus: Corpus }) {
  const sources = getSourcesForIds(corpus, symptom.sourceIds);
  const matchingEntries = corpus.entries.filter((entry) => entry.symptomIds.includes(symptom.id));

  return (
    <>
      <Header />
      <main className="detail-main">
        <a href="/" className="back-link">Back to lookup</a>
        <article className="detail-article">
          <p className="eyebrow">Symptom guide</p>
          <h1>{symptom.title}</h1>
          <p className="detail-meaning">{symptom.summary}</p>
          <div className="safety-callout">
            <HardHat aria-hidden="true" />
            <p>{corpus.site.safetyBoundary}</p>
          </div>
          <section>
            <h2>Printable pre-service checklist</h2>
            <ul>{symptom.safeChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
            <button type="button" className="print-button" onClick={() => window.print()}>
              <Printer aria-hidden="true" />
              Print checklist
            </button>
          </section>
          <section>
            <h2>Matching verified codes</h2>
            <div className="result-grid compact">
              {matchingEntries.map((entry) => <EntryCard entry={entry} key={entry.id} />)}
            </div>
          </section>
          <section>
            <h2>Official source</h2>
            <div className="source-list compact">
              {sources.map((source) => (
                <a href={source.url} key={source.id} target="_blank" rel="noreferrer" className="source-row">
                  <span>{source.brand}</span>
                  <strong>{source.title}</strong>
                  <small>{source.url}</small>
                </a>
              ))}
            </div>
          </section>
        </article>
        <MonetizationBand corpus={corpus} />
      </main>
      <Footer />
    </>
  );
}

function NotFound() {
  return (
    <>
      <Header />
      <main className="detail-main">
        <article className="detail-article">
          <h1>Code not verified yet</h1>
          <p className="detail-meaning">This atlas rejects unsourced codes. Try the lookup or check the official manual for your exact model.</p>
          <a className="print-button" href="/">Search verified codes</a>
        </article>
      </main>
    </>
  );
}

function LoadingShell() {
  return (
    <>
      <Header />
      <main className="detail-main">
        <article className="detail-article">
          <h1>Loading RV Appliance Code Atlas</h1>
          <p className="detail-meaning">Loading the verified source-backed corpus.</p>
        </article>
      </main>
    </>
  );
}

function LoadError({ message }: { message: string }) {
  return (
    <>
      <Header />
      <main className="detail-main">
        <article className="detail-article">
          <h1>Corpus unavailable</h1>
          <p className="detail-meaning">{message}</p>
          <p>Try reloading the page. If this keeps happening, use the official appliance manual for your exact model.</p>
        </article>
      </main>
    </>
  );
}

function Footer() {
  return (
    <footer>
      <p>Free lookup. Official sources first. No checkout. No DIY gas/electrical repair instructions.</p>
    </footer>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
