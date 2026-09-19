# Feedback Video Script (short reflection)

This one is about your experience building the project, not a feature walkthrough —
keep it conversational, 1–3 minutes, just you talking to camera or over a slide/screen.

Answer these three questions in your own words:

## 1. What did you learn?
Prompts to draw from (pick what's actually true for you):
- Designing a guarded state machine (the work-order lifecycle) and enforcing it
  server-side instead of trusting the UI.
- Role-based access control with Spring Security (`@PreAuthorize`, JWT claims).
- Keeping a multi-step operation (decrementing part stock + recording usage)
  transactionally consistent.
- Structuring a layered Spring Boot app (controller → service → repository) and
  why DTOs matter at the API boundary.
- Wiring a React + TypeScript SPA to a REST API with role-aware routing.

## 2. What challenges did you face?
Be specific and honest — reviewers respond better to real friction than a generic
"no challenges." Examples of the kind of thing to mention (only if true for you):
- Getting Flyway migrations and JPA entity mappings to line up exactly.
- Debugging CORS between the deployed frontend and backend.
- Deciding how strict to make the lifecycle transition rules.
- Free-tier deployment quirks (cold starts, environment variable wiring).

## 3. Key takeaways
- What would you do differently if you started over?
- What are you most proud of in the final result?
- How does this project change how you'll approach the next one?

## Recording tips
- Script yourself 3–5 bullet points per question so you're not reading word-for-word,
  but also don't ramble without structure.
- Record in a quiet space; a plain background is fine — this is about the content.
- Upload to YouTube (unlisted) or Drive with "Anyone with the link" sharing enabled.
