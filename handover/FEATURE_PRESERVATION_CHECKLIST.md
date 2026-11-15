# Feature preservation checklist

Meaning: retained source is not necessarily connected/accepted in cloud. See original detailed docs/integrated/TEST_REPORT.md and each evidence JSON.

| Feature | Actual state |
|---|---|
| Original full Teacher/Student navigation/theme/non-exam sections | Preserved exact protected sections; 71 original helper/assets unchanged |
| MCQ, True/False, Fill, Subjective; custom 30/50 mixed banks and marks | Retained; helper tests PASS |
| Selection 30/50, edit/delete/reorder/alternatives/duplicates, advanced controls | Retained; local helper/manual-builder tests; actual AI alternatives unavailable |
| English/Hindi/Odia/Hinglish canonical IDs/options/marks/TF tokens, reviewed draft translations | Retained/contract-tested; actual AI translation BLOCKED |
| AI Generate/per-question Re-Generate | Original integration retained as reference; isolated request fails closed; no new actual generation PASS |
| PDF import, inline MCQ/multiline/sections/warnings/selective bank workflow | Retained; actual 47-question fixture PASS; image OCR NOT implemented; font-encoded Hindi/Odia limitations remain |
| Manual question builder, diagrams/upload/templates | Retained; no new redesign; exhaustive browser upload/circuit layout acceptance pending |
| Question Approval JF/NTPC A4 Portrait | Reference hashes/renderers PASS; exhaustive golden pixel comparison pending |
| Individual Answer Sheet A4 Portrait, logo/selfie/order/answers/scores/signatures | Retained; own published synthetic browser download PASS |
| Consolidated Result A4 Landscape | Reference/hash/dimensions/render PASS; exhaustive multi-page multilingual comparison pending |
| Reference QR | Reference-only, no live verification success |
| Scheduling, eligibility, language and persisted student-wise question order | Server guards/contract tests PASS; no option shuffle; same selected question set |
| Consent/selfie, camera/mic initialization/cleanup, local vision worker/model | Locked algorithms/helper assets retained; prior desktop synthetic inference/close PASS; NEW integrated physical Android PENDING |
| Fullscreen/app-switch, warning counter, five-warning policy | Locked detection retained; backend policy tests PASS; physical Android PENDING |
| Teacher monitoring, Warn/Hold/Block/Clear/Resume and audit | Full shell browser synthetic server-confirmation PASS; no live streaming/evidence photo uploads |
| Timer, immutable deadline, expiry/reopen | Server tests PASS; no refresh reset; explicit audited reopen only |
| Autosave, initial+2 changes, IndexedDB recovery, retry receipts/concurrency | Contract tests PASS; original AnswerStore full-shell browser save/submit PASS; desktop offline fixture historical PASS |
| Final submission and server receipt | Fresh restored contract tests PASS; previous full-shell synthetic workflow PASS |
| Teacher Review V2, half marks, private save then publish | Local contract/full-shell synthetic PASS |
| Own published result/PDF, unpublished/other-student denial | Local contract/PDF workflow PASS |
| Audit/recovery, permanent delete | Audited recovery contract PASS; full chooser/destructive adapter acceptance PENDING; destructive API fail-closed |
| Firebase auth/master, historical read federation, production projection | Design/isolated fixture only; approval gates, DISABLED |
| Cloudinary/private photo upload/storage | Production unchanged; secure new private storage integration BLOCKED |
| 30+20 and 50-user concurrency | Local synthetic PASS, cloud load/CPU/quotas NOT RUN |

Four approved SHA-256 references, in references/approved-pdfs:
1. Consolidated A4 Landscape: 954BA57B2C93F37C3F24831126657E2460C8C0D64B1D1C4E5130CFEF9E35BF20
2. Approval JF Portrait: C6C8FC8459DEECD88D2F17D0522BAE3A4D143842BB3164CFBF11B25777235D8F
3. Approval NTPC Portrait: 84069BB063273BAE4B850F3444A195131A4ABA4E6BBEE49D8D54866D5DB67288
4. Individual Portrait: 12639646F071C8B692C091DD2EAAA9D461F113F81B79B03E665CD512F797552F
