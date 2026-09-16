# Roadmap

- [x] Swap ArticlePage text to TranslatedArticleBody; Hindi article verified end to end
- [x] Hindi Prime Time dashboard (English/हिन्दी toggle, Hindi sources, Hindi narration) + Hindi X post templates
- [x] Sarvam voice fallback queue (Sarvam -> ElevenLabs -> browser, never stops)
- [x] Publish GAINN to live URL
- [x] Site-wide language switch (headlines/summaries + narration follow the chosen language) — verified in preview
- [x] Hindi Prime Time schedule page (time picker, day picker, live bulletin) — verified end to end in Hindi
- [ ] Blocked: news provider is on the free developer plan (100 requests/day) — Hindi live feed falls back to cached stories until the plan is upgraded (paid upgrade on the provider's own site)
- [ ] Persist the public live-news cache so fresh signed-out browsers receive the same latest stories
- [ ] Remove fabricated verification scores and perspective claims; add source-backed article verification data/UI
- [ ] Defer below-fold homepage work and improve ticker/image rendering without changing the layout
- [x] Route compatible backend text-generation calls through OpenRouter first, with Lovable AI fallback
