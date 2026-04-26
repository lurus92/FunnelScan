# FunnelScan Hackathon Gap Analysis

Reference: AI Agent Economy Hackathon Participant Guide (April 25, 2026).

## What FunnelScan already covers
- Real B2B use case: CRO audit for websites.
- Working agent flow: URL + persona -> fetch content -> AI analysis -> structured report.
- Demo-friendly UI and API endpoint (`POST /analyze`).

## Main gaps vs judging rubric and submission expectations
1. **Business value proof is weak**
   - Output explains UX issues but does not estimate likely conversion impact or ROI framing.

2. **Execution completeness can feel MVP-only**
   - Single-page scrape only, no explicit handling for page-type funnels (pricing/signup/checkout).
   - No export/share mode for quickly showing results to judges.

3. **Innovation signal is modest**
   - Primarily a single LLM call + fallback heuristics.
   - Limited “agentic” behavior (no planning loop, no follow-up tasking, no continuous monitoring).

4. **Presentation polish was missing**
   - Prior to this update there was no prioritized implementation roadmap in the output.

## Implemented in this sprint (fits within ~1 hour)
- Added **prioritized 1-hour action plan** to the model output (`action_plan` with priority, impact, effort).
- Added **business impact summary** (`business_impact`) to better communicate monetizable value.
- Updated frontend to display the new sections for clearer judging/demo storytelling.
- Added **Copy Report JSON** button for faster demo handoff and submission packaging.

## Next 60-minute improvements to consider
1. Add a preset objective selector (Lead Gen / SaaS Trial / Ecommerce Purchase) and tune prompts.
2. Add an “above-the-fold only” extraction mode to improve signal quality.
3. Add one-click downloadable markdown report for judges and client sharing.
4. Add a tiny benchmark mode: compare current homepage vs rewritten hero with a checklist score delta.
