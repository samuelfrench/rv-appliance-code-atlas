---
title: "Add privacy-minimal GA4 client-error events"
status: next
area: analytics
due: null
updated: 2026-11-08
owner: agent
brief: "The retained InvalidArgument result is a measurement gap; instrumentation and later provider proof remain open"
refs:
  - "TODO-archive.md"
test: null
---

- **What:** Preserve the unfinished client-error instrumentation task.
- **Why:** The October 26 collection error was not a measured zero; this migration does not change instrumentation or provider settings.
- **Next:** Implement the named canonical-host-only events without raw error messages, stacks or personal data; validate locally and use existing provider authority for any required custom dimension. Record the later collection result.

<!-- Migrated verbatim from TODO.md @ 7f65a1f45e64fc55d019decdbc6052d368ec2547, lines 63-66, on 2026-11-08. -->
## GA4 client-error events

- [ ] Emit GA4 events named `JS Error` and `Unhandled Rejection` with event category `Error` on `rvappliancefaultcodes.com` (property `rv-appliance-fault-codes`, GA4 property `540096507`). Register an event-scoped custom dimension `event_category` if the Data API rejects `customEvent:event_category`. The 2026-10-26 21:08 CT traffic-report collect stored this property's 7-day `clientErrors` series as `error` (GA4 report failed (InvalidArgument); other reports remain available.). That is not a measured zero. Coffee Explorer is the working reference from that same collect: status `available`, 14 rows, host `mycoffeeexplorer.com`. Done when a later collect shows `errorDaily.status` `available` for this property. A complete empty series counts as a measured zero. `InvalidArgument` stays a gap. Do not copy Coffee route recovery, 404s, or per-day error labels. No application code was changed when this note was added. <!-- client-error-events-20261026 -->


<!-- End of verbatim migrated material. -->
