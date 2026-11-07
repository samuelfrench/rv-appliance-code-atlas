// canonical: explorer-pipeline seo 4f501cb5dd1e seo/java/SeoContentDates.java. Do not edit this copy: change explorer-pipeline/seo, then re-vendor with seo/vendor.mjs.
// Reference reader for the seo content-dates ledger, for Java Spring sitemap controllers (coffee, tea, beer, honey,
// mushroom, marketing-ai). Copy it into the site (change the package line), keep the rest identical.
// Java 17+, Jackson only (Spring Boot ships it). No Spring annotations: construct it once, e.g. as a field or @Bean.
//
// Where the ledger comes from: the frontend build writes <dist>/seo/content-dates.json (seo-template `finalize`), and
// the Docker image copies dist to /usr/share/nginx/html, so the JVM in the same container reads
// /usr/share/nginx/html/seo/content-dates.json. Override with -Dseo.contentDates.path=... or SEO_CONTENT_DATES_PATH;
// a classpath copy at seo/content-dates.json is the fallback (useful in tests). The file is re-read when it changes.
//
// Use in a controller:
//   private final SeoContentDates contentDates = new SeoContentDates();
//   Optional<SeoContentDates.Entry> e = contentDates.lookup(path);
//   String lastmod = e.isPresent() ? (e.get().lastmod() == null ? null : e.get().lastmod().toString())  // ledger knows the URL
//                                  : existingLastmod(path);                                             // Java-only URL
//   if (lastmod != null) xml.append("<lastmod>").append(lastmod).append("</lastmod>");
// A known URL with a null lastmod means "no trustworthy date": omit <lastmod>, do not fall back to a guess.
package com.example.seo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Optional;

public final class SeoContentDates {
    public static final String DEFAULT_PATH = "/usr/share/nginx/html/seo/content-dates.json";
    public static final String CLASSPATH_RESOURCE = "seo/content-dates.json";
    private static final long RECHECK_MILLIS = 60_000;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** firstSeen and lastmod may be null: the ledger knows the URL but has no trustworthy date. */
    public record Entry(LocalDate firstSeen, LocalDate lastmod) {}

    private final Path file;
    private volatile Map<String, Entry> entries = Collections.emptyMap();
    private volatile String source = "none";
    private volatile FileTime loadedMtime;
    private volatile long checkedAt;

    public SeoContentDates() {
        this(Path.of(firstNonBlank(System.getProperty("seo.contentDates.path"), System.getenv("SEO_CONTENT_DATES_PATH"), DEFAULT_PATH)));
    }

    public SeoContentDates(Path file) {
        this.file = file;
        reloadIfChanged(true);
    }

    public Optional<Entry> lookup(String urlOrPath) {
        reloadIfChanged(false);
        String key = normalizePath(urlOrPath);
        return key == null ? Optional.empty() : Optional.ofNullable(entries.get(key));
    }

    public Optional<LocalDate> lastmod(String urlOrPath) {
        return lookup(urlOrPath).map(Entry::lastmod);
    }

    public Optional<LocalDate> firstSeen(String urlOrPath) {
        return lookup(urlOrPath).map(Entry::firstSeen);
    }

    public int size() {
        return entries.size();
    }

    /** "file:<path>", "classpath:seo/content-dates.json" or "none". */
    public String source() {
        return source;
    }

    /**
     * Same rules as seo/lib/paths.mjs normalizePath: pathname only, no trailing slash except "/", no index.html.
     * Returns null for a blank or unparseable URL (never "/": a bad URL must not get the homepage's dates).
     */
    public static String normalizePath(String urlOrPath) {
        if (urlOrPath == null || urlOrPath.isBlank()) return null;
        String value = urlOrPath.trim();
        if (value.matches("(?i)^[a-z][a-z0-9+.-]*://.*")) {
            try {
                value = URI.create(value).getRawPath();
            } catch (IllegalArgumentException e) {
                return null;
            }
            if (value == null || value.isEmpty()) value = "/";
        }
        int cut = value.indexOf('#');
        if (cut >= 0) value = value.substring(0, cut);
        cut = value.indexOf('?');
        if (cut >= 0) value = value.substring(0, cut);
        if (!value.startsWith("/")) value = "/" + value;
        value = value.replaceAll("/{2,}", "/").replaceAll("(?i)/index\\.html?$", "/");
        if (value.length() > 1) value = value.replaceAll("/+$", "");
        return value.isEmpty() ? "/" : value;
    }

    private synchronized void reloadIfChanged(boolean force) {
        long now = System.currentTimeMillis();
        if (!force && now - checkedAt < RECHECK_MILLIS) return;
        checkedAt = now;
        try {
            if (Files.isRegularFile(file)) {
                FileTime mtime = Files.getLastModifiedTime(file);
                if (!force && mtime.equals(loadedMtime)) return;
                try (InputStream in = Files.newInputStream(file)) {
                    entries = parse(MAPPER.readTree(in));
                }
                loadedMtime = mtime;
                source = "file:" + file;
                return;
            }
            if (!force && source.startsWith("classpath:")) return;
            try (InputStream in = SeoContentDates.class.getClassLoader().getResourceAsStream(CLASSPATH_RESOURCE)) {
                if (in != null) {
                    entries = parse(MAPPER.readTree(in));
                    source = "classpath:" + CLASSPATH_RESOURCE;
                }
            }
        } catch (IOException | RuntimeException e) {
            // Keep the last good copy; a broken ledger must never break /sitemap.xml.
        }
    }

    static Map<String, Entry> parse(JsonNode root) {
        if (root == null || root.path("version").asInt() != 1 || !root.path("urls").isObject()) return Collections.emptyMap();
        Map<String, Entry> out = new HashMap<>();
        Iterator<Map.Entry<String, JsonNode>> it = root.path("urls").fields();
        while (it.hasNext()) {
            Map.Entry<String, JsonNode> field = it.next();
            JsonNode value = field.getValue();
            String key = normalizePath(field.getKey());
            if (value.hasNonNull("removed") || key == null) continue;
            out.put(key, new Entry(date(value.get("firstSeen")), date(value.get("lastmod"))));
        }
        return Collections.unmodifiableMap(out);
    }

    private static LocalDate date(JsonNode node) {
        if (node == null || !node.isTextual()) return null;
        try {
            return LocalDate.parse(node.asText().substring(0, Math.min(10, node.asText().length())));
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) if (v != null && !v.isBlank()) return v;
        return null;
    }
}
