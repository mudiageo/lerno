# Feature Map & User Personas

## Complete Feature Map

### 🏠 Scroll Mode (BlueSky/X-style)
| Feature | Free | Premium | Notes |
|---|---|---|---|
| Infinite feed | ✅ | ✅ | Vertical scroll, TanStack Query pagination |
| AI-generated posts (text, quiz, flashcard, poll) | 50/day | Unlimited | Toggleable per user |
| Student-created posts | ✅ | ✅ | All post types |
| Threads / replies | ✅ | ✅ | Depth-3 nesting |
| Reposts + Quote posts | ✅ | ✅ | |
| Likes + Bookmarks | ✅ | ✅ | Optimistic UI |
| Polls | ✅ | ✅ | Up to 4 options, expiry time |
| Topic hashtag filter | ✅ | ✅ | Click tag → filtered feed |
| Surprise quiz questions | ✅ | ✅ | Fibonacci positions (8,21,34…) |
| Compose post | ✅ | ✅ | Text, image, video, quiz, flashcard, poll |
| Course filter toggle | ✅ | ✅ | Switch between courses in feed |
| Follow/unfollow users | ✅ | ✅ | |
| Mute / Block | ✅ | ✅ | |
| Report content | ✅ | ✅ | |
| AI content toggle | ✅ | ✅ | Per-user setting |

### 📺 Watch Mode (YouTube-style)
| Feature | Free | Premium | Notes |
|---|---|---|---|
| Video grid (own platform) | ✅ | ✅ | Cloudflare Stream HLS |
| YouTube embeds (curriculum-tagged) | ✅ | ✅ | IFrame, nocookie domain |
| Shorts player (vertical) | ✅ | ✅ | Swipeable TikTok-style |
| Video upload | ✅ | ✅ | Stored on Cloudflare Stream |
| Offline download (own platform only) | ❌ | ✅ | Signed URL + device token |
| Live streams (viewer) | ✅ | ✅ | |
| Live streams (host) | ✅ | ✅ | 1 active stream per user |
| Video notes / timestamp bookmarks | ✅ | ✅ | |
| Watch history | ✅ | ✅ | |
| YouTube timestamp deep-links | ✅ | ✅ | Jump to relevant section |

### 📚 Study Mode (Focused)
| Feature | Free | Premium | Notes |
|---|---|---|---|
| Flashcard sessions (FSRS) | ✅ | ✅ | SM-2 variant, due-date scheduling |
| Topic quiz sessions | ✅ | ✅ | 10 questions per session |
| Mock exam generator | 1/month | Unlimited | AI-generated full paper |
| Past exam question bank | ✅ | ✅ | User-contributed + AI-paraphrased |
| Pomodoro timer | ✅ | ✅ | 25/5 default, customizable |
| Mastery heatmap | ✅ | ✅ | Per-course topic map |
| Detailed analytics | Basic | Full | Free: last 7 days; Premium: all time |
| Spaced repetition schedule | ✅ | ✅ | FSRS algorithm |
| Note upload (PDF/image) | ✅ | ✅ | OCR + AI extraction |
| AI tutor chatbot | 10 msgs/day | Unlimited | In-context per post/topic |

### 🔴 Live (Streams + Spaces)
| Feature | Free | Premium | Notes |
|---|---|---|---|
| Watch live streams | ✅ | ✅ | |
| Host live stream | ✅ | ✅ | WebRTC custom + LiveKit fallback |
| Join Spaces (audio) | ✅ | ✅ | |
| Host Spaces | ✅ | ✅ | |
| Stream recording | ❌ | ✅ | Auto-saved to R2 |
| Stream scheduling | ✅ | ✅ | Calendar card in feed |
| Live chat | ✅ | ✅ | |
| Raise hand | ✅ | ✅ | |

### 🏘️ Communities
| Feature | Free | Premium | Notes |
|---|---|---|---|
| Join communities | ✅ | ✅ | Max 10 free, unlimited premium |
| Create community | ✅ | ✅ | 1 free, unlimited premium |
| Community feed | ✅ | ✅ | Scoped to community |
| Community leaderboard | ✅ | ✅ | |
| Private communities | ✅ | ✅ | Invite-only |
| Community resources | ✅ | ✅ | Shared file/link bank |

### 🎮 Gamification
| Feature | Free | Premium | Notes |
|---|---|---|---|
| XP system | ✅ | ✅ | 10 levels, 14 event types |
| Daily streak | ✅ | ✅ | Fire emoji counter |
| Streak freeze | ❌ | 2/month | Use to protect streak |
| Leaderboards (global/course/friends) | ✅ | ✅ | |
| Achievement badges | ✅ | ✅ | 20 badges |
| XP animations + celebration effects | ✅ | ✅ | |
| Referral rewards | ✅ | ✅ | 7-day premium for each referral |

### ⚙️ Settings & Account
| Feature | Notes |
|---|---|
| Dark / Light / OLED / System theme | Saved to DB, synced across devices |
| Dyslexia font toggle | OpenDyslexic font, wider letter spacing |
| Reduced motion toggle | Disables all animations |
| AI content toggle | Global, per-user |
| Course management | Add/edit/archive courses |
| Exam schedule | Add events, get reminders |
| Notification preferences | Per-type granular control |
| Accessibility | Screen reader labels on all interactive elements |
| Data export | JSON download of all personal data |
| Account deletion | GDPR-compliant, 30-day wipe |
| Billing / subscription | Manage plan, payment method, invoices |

---

## User Personas

### Persona 1: Mudia — The Engineering Student
**Age:** 21 | **Program:** Computer Engineering, Year 3  
**Courses:** CPE461 (Software Engineering), CPE453 (Microprocessors), CPE457 (Digital Signal Processing)  
**Study habit:** Procrastinator who works well under pressure. Doomscrolls Twitter and YouTube for hours.  
**Pain point:** Doesn't realize how behind he is until a week before exams.  
**How he uses Lerno:**
- Opens app instead of Twitter during lunch
- Scrolls quiz posts on CPE461 topics; gets a surprise question on Sommerville's spiral model (he gets it right — he was the project lead)
- Watches a 3-min AI-generated video summary on Intel 8085 memory addressing
- Bookmarks a past exam question on interrupt handling for later
- Earns a 14-day streak badge; his CPE453 mastery jumps from 42% to 61%

**Key feature usage:** Feed scroll, surprise questions, video watch mode, streaks  
**Conversion trigger:** Mock exam generator — needs a full practice paper 5 days before CPE461 final

---

### Persona 2: Fatima — The Medical Student
**Age:** 23 | **Program:** Medicine, Year 4  
**Courses:** Pharmacology, Pathology, Clinical Medicine  
**Study habit:** Disciplined but overwhelmed by volume. Uses Anki, but finds it boring.  
**Pain point:** Too much to memorize; struggles to retain drug mechanisms under pressure.  
**How she uses Lerno:**
- Uses Study Mode exclusively — flashcard sessions on drug classes every morning
- Creates her own flashcard posts for drug mechanisms (earns XP, community upvotes them)
- Joins the MedStudents_NG community for past exam questions
- Sets exam reminders for all 6 of her scheduled assessments
- The algorithm detects weak Pharmacology mastery and floods her feed with drug mechanism quizzes

**Key feature usage:** Study mode, flashcards, communities, note upload  
**Conversion trigger:** Unlimited AI content + all-time analytics (institutional license from her school)

---

### Persona 3: Chidi — The Tutor/Lecturer Assistant
**Age:** 26 | **Program:** MSc student, part-time tutor  
**Courses:** Teaches undergraduate Data Structures and Algorithms  
**Pain point:** Students don't prepare for tutorials; wastes everyone's time.  
**How he uses Lerno:**
- Creates a DSA community for his students
- Posts quiz cards on Big-O complexity before each tutorial
- Hosts a weekly 1-hour live study Space (audio-only Q&A)
- Uploads his own tutorial notes as PDF — platform OCRs them, generates flashcards automatically
- Monitors community leaderboard to identify struggling students

**Key feature usage:** Communities, live streams, Spaces, video upload, post creation  
**Conversion trigger:** Institutional license interest (pitches to his department)

---

### Persona 4: Amara — The Secondary School Student
**Age:** 17 | **Program:** SS3, WAEC/JAMB prep  
**Courses:** Mathematics, Physics, Chemistry, English, Economics  
**Pain point:** No structured revision plan; JAMB is 3 months away.  
**How she uses Lerno:**
- Registers JAMB subjects as "courses"
- Feed is flooded with JAMB-style questions in a familiar social media format
- Plays Shorts of quick Math tricks (feels like TikTok)
- Joins WAEC_Prep_2026 community with 12,000 members
- Competes on the leaderboard against classmates

**Key feature usage:** Shorts, communities, leaderboard, quiz posts, mobile app  
**Conversion trigger:** Premium individual purchase — AI mock exam paper for each subject (one-time ₦500/each)
