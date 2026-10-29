# PRD: Prompt-to-Shorts Video Generator

**Author:** Sanjay Polamarasetti | Data Analyst **Status:** Draft v1.0 **Date:** October 29, 2026

## 1. Overview

A free, no-login website with a single search bar. The user types or pastes a prompt, presses Enter, and the site generates a vertical (9:16), full-screen video of exactly 60 seconds based on that prompt. The site decides on its own whether the video should be in **anime style** or **realistic (human/live-action look)** style, depending on the prompt. The finished video can be downloaded in **1080p only** (1080 x 1920), ready to upload to YouTube Shorts and Instagram Reels.

## 2. Problem Statement

Short-form creators need a steady stream of vertical videos. Making each one means writing a script, finding visuals, recording or generating voice, editing, and exporting in the right format. Existing AI video tools are usually paid, produce short clips (5 to 10 seconds), need manual stitching, or offer unpredictable aspect ratios and resolutions.

## 3. Goals

1. One prompt in, one finished 60-second vertical video out, with no editing needed.
2. Output is always exactly 60.00 seconds, 9:16, 1080 x 1920.
3. Style (anime vs realistic) is chosen automatically from the prompt.
4. Free to use, no signup required.
5. Output is directly uploadable to YouTube Shorts and Instagram Reels.

## 4. Non-Goals (v1)

- No video editor or timeline.
- No other durations, aspect ratios or resolutions (no 720p, no landscape).
- No direct publishing to YouTube or Instagram.
- No user accounts, payments or video library.
- No uploading of the user's own footage.

## 5. Target Users

- **Primary:** Short-form content creators (YouTube Shorts, Instagram Reels) who want fast, consistent output.
- **Secondary:** Small businesses, educators and storytellers who need quick explainer or story videos.

## 6. User Flow

1. User lands on the home page and sees a large search bar with a placeholder such as "Describe your 60-second video...".
2. User types or pastes a prompt and presses **Enter** (or taps the generate button on mobile).
3. Site shows a progress screen with stages: *Understanding prompt → Writing script → Creating visuals → Adding voice and music → Finalizing 60s video*.
4. A vertical full-screen preview player appears when the video is ready.
5. User taps **Download 1080p** and gets an MP4 file.
6. User can enter a new prompt to generate another video.

## 7. Functional Requirements

### 7.1 Prompt Input

- FR-1: Single search bar, supports multi-line pasted text, up to about 1,000 characters.
- FR-2: Pressing Enter submits the prompt. Shift+Enter inserts a new line.
- FR-3: Empty or too-short prompts show a friendly validation message.
- FR-4: Prompts that violate content policy (see section 11) are rejected with a clear message.

### 7.2 Style Detection (Anime vs Realistic)

- FR-5: An AI classifier reads the prompt and picks one style: **Anime** or **Realistic**.
- FR-6: Detection signals include explicit words ("anime", "manga", "Studio Ghibli style", "cinematic", "real life", "documentary"), genre (fantasy and superhero lean anime; news, travel, motivation, product and real-world scenes lean realistic), and subject (human characters in real settings lean realistic).
- FR-7: If the prompt explicitly names a style, that choice always overrides the classifier.
- FR-8: The chosen style is shown to the user as a small label on the result page (display only in v1; no manual override).

### 7.3 Script and Storyboard Generation

- FR-9: An LLM converts the prompt into a 60-second script with a hook in the first 3 seconds, a body, and a closing line or call to action.
- FR-10: The script is split into scenes (target 8 to 12 scenes of roughly 5 to 7 seconds each). Each scene has a narration line, a visual description, and a duration.
- FR-11: Scene durations must sum to exactly 60 seconds.
- FR-12: Character and style consistency is maintained across scenes (same character description, color palette and art style carried into every scene's visual prompt).

### 7.4 Visual Generation

- FR-13: Each scene is generated as a video clip or animated image in the chosen style, in vertical 9:16 framing.
- FR-14: Visuals fill the entire frame (full screen, no letterboxing, no black bars).
- FR-15: Safe zones: key subjects and captions stay clear of the areas covered by YouTube Shorts and Instagram UI (roughly the top 10% and bottom 20% of the frame).

### 7.5 Audio

- FR-16: AI voiceover narrates the script, with a voice selected to fit the style and prompt.
- FR-17: Royalty-free background music matched to mood, ducked under the voice.
- FR-18: Burned-in, word-highlighted captions (large, high-contrast) for silent viewing.

### 7.6 Assembly and Export

- FR-19: Clips, voice, music and captions are stitched together with FFmpeg.
- FR-20: Final length is trimmed or padded to exactly **60.00 seconds**. Automated check fails the job and retries if the length differs by more than 0.1 second.
- FR-21: Final export is **MP4, H.264 video, AAC audio, 1080 x 1920, 9:16, 30 fps**.
- FR-22: Only the **1080p** download is offered. No other quality options are shown.
- FR-23: Download file name is derived from the prompt (for example, `my-prompt-60s-1080p.mp4`).

### 7.7 Progress, Errors and Retries

- FR-24: Real-time progress indicator with an estimated wait time.
- FR-25: If a scene fails, the system retries automatically (up to 2 times) before failing the whole job.
- FR-26: On failure, the user sees a clear message and can resubmit the prompt with one click.

## 8. Non-Functional Requirements

| Area | Requirement |
| --- | --- |
| Cost | Free for users; no login. Abuse control through rate limits (for example, 2 to 3 videos per device per day) |
| Performance | Target generation time under 5 minutes per video; queue position shown when busy |
| Reliability | 95% of submitted prompts produce a valid 60s video |
| Compatibility | Works on mobile and desktop browsers (Chrome, Safari, Edge, Firefox) |
| Privacy | No account data collected; generated videos auto-deleted from servers after 24 hours |
| Accessibility | Keyboard-operable, captions on all videos, readable contrast |
| Output spec | 1080 x 1920, 9:16, 30 fps, MP4, exactly 60.00 seconds |

## 9. Suggested Technical Approach

**Pipeline:** Prompt → Safety check → Style classifier → Script and storyboard LLM → Per-scene image/video generation → Text-to-speech → Music → FFmpeg assembly with captions → Duration and format validation → Download link.

- **Frontend:** React or Next.js, single-page UI with search bar, progress view, preview player and download button.
- **Backend:** Job queue (for example, BullMQ or a serverless queue) with worker processes; each job runs the pipeline stages.
- **AI components:** LLM for classification and scripting; image or video generation model per scene (anime-tuned and photoreal-tuned variants); text-to-speech; captions from word-level timestamps.
- **Rendering:** FFmpeg for stitching, scaling to 1080 x 1920, audio mixing and caption burn-in.
- **Storage:** Temporary object storage with 24-hour expiry and signed download URLs.

**Cost-control strategy for a free product:** For v1, use animated stills (pan, zoom and parallax motion on generated images) rather than fully generated video for every second, and reserve true generated motion for hook scenes. This keeps compute low while still producing a polished vertical video. Upgrade to full AI video clips as budget allows.

## 10. Success Metrics

- Generation success rate (target 95% or higher).
- Percentage of outputs that are exactly 60s and 1080 x 1920 (target 100%).
- Median generation time.
- Download rate (downloads divided by completed videos; target 60% or higher).
- Style-detection satisfaction (share of users who regenerate because the style was wrong; target under 10%).
- Repeat usage within 7 days.

## 11. Content Safety and Legal

- Block prompts for sexual content, graphic violence, hate, harassment, and content involving minors in unsafe contexts.
- Block prompts that request real, named people (deepfakes) and copyrighted characters or brands.
- Use only royalty-free or properly licensed music and AI models whose licenses allow commercial output; state usage terms on the site.
- Consider an "AI-generated" label or metadata, since YouTube and Instagram require disclosure of realistic AI-generated content.

## 12. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| True AI video generation is GPU-heavy, so "free" is expensive at scale | High | Animated-stills approach, daily limits per device, queue, optional sponsor or ad support later |
| Most video models create only 5 to 10 second clips | Medium | Scene-based stitching with consistent style prompts |
| Character inconsistency across scenes | Medium | Reuse a fixed character description and seed or reference image per job |
| Wrong style chosen (anime vs realistic) | Medium | Explicit-keyword override; track regenerate rate; add a manual toggle in v2 |
| Abuse and spam load | Medium | Rate limits, CAPTCHA, prompt safety filter |
| Exact 60s requirement missed | Low | Automated duration validation, trim or pad, auto-retry |

## 13. Release Plan

- **MVP (v1):** Search bar, auto style detection, 60s vertical 1080p output, voiceover, captions, music, download.
- **v1.1:** Manual style override, voice choice, regenerate single scene.
- **v2:** Accounts and history, more voices and styles, optional multi-resolution and duration for premium users, direct upload to YouTube and Instagram.

## 14. Open Questions

1. What is the monthly budget for compute, since "free" depends on it?
2. Should videos carry a small watermark to help fund and promote the site?
3. Which languages should voiceover and captions support in v1?
4. Should the first version show a style label only, or allow users to override the style?
5. Is a hard daily limit per user acceptable?
