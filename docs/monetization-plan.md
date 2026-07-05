# Monetization Plan (designed 2026-07-04, all disabled until thresholds pass)

## Primary path: mobile RV repair lead capture

Code and symptom pages catch owners at the breakdown moment. Competitors monetizing the same queries: RV Fridge Guys (repair service), ARP (product), JustAnswer (paid Q&A).

CTA design for code detail pages (below owner-safe checks, above sources):

- Heading: "Need a mobile RV tech?"
- Body: one line — "Bring these pre-call facts: model, code, and what you already checked."
- Button: "Find a mobile RV tech near you"
- V1 behavior: static form (name, ZIP, appliance brand, code prefilled) posting to a private handler
  (Fly app endpoint with server-side validation + rate limiting, or a Formspree-class service).
  No public write API on the site itself; nothing that can add or modify site content.
- Lead routing v1: email to Sam; manual matching to mobile techs. Sell leads or referral-fee once volume exists.
- Gate: enable only when `code-detail-bottom` slot passes the monetization-readiness threshold
  (500 weekly impressions on candidate pages) per `npm run traffic:monetization`.

## Secondary: affiliate (placeholder-only until thresholds pass)

- Amazon Associates: Norcold/Dometic power boards, thermistors, ARP fridge controller, Suburban anode rods.
  Apply only once there is enough traffic to make the 180-day/3-sale qualification.
- JustAnswer affiliate program: fits "talk to an RV technician now" intent on service-only pages.
- RV parts vendors (etrailer affiliate program, PPL Motorhomes): parts links on code pages that name a part.

## Not pursuing near-term

- Display ads: AdSense RPM too low at current volume; Mediavine/Raptive need ~50k sessions/month.
- Sponsorships: no audience yet.
