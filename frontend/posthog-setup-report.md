<wizard-report>
# PostHog post-wizard report

The wizard has completed a full PostHog integration for the Idea Platform frontend. `posthog-js` and `@posthog/react` were installed, a `PostHogProvider` was added to the root route, a Vite reverse-proxy was configured to route all `/ingest/*` traffic through the EU PostHog endpoint, and environment variables were written to `.env.development`. Twelve business events were instrumented across authentication, content creation, engagement, and search flows. Users are identified by their internal ID (with email and name) on every email login and registration.

| Event | Description | File |
|---|---|---|
| `user_logged_in` | Fires when a user successfully logs in with email/password | `src/features/auth/ui/LoginForm.tsx` |
| `user_signed_up` | Fires when a user creates a new account via email registration | `src/features/auth/ui/RegisterForm.tsx` |
| `user_logged_out` | Fires when a user confirms logout from the logout dialog | `src/features/auth/ui/LogoutConfirmDialog.tsx` |
| `idea_published` | Fires when a user publishes a new idea or saves changes to a published idea | `src/features/ideas/ui/create-idea/IdeaCreateForm.tsx` |
| `idea_draft_saved` | Fires when a user saves an idea as a draft | `src/features/ideas/ui/create-idea/IdeaCreateForm.tsx` |
| `problem_published` | Fires when a user publishes a new problem or saves changes to a published problem | `src/features/problems/ui/submit-problem/SubmitProblemForm.tsx` |
| `problem_draft_saved` | Fires when a user saves a problem as a draft | `src/features/problems/ui/submit-problem/SubmitProblemForm.tsx` |
| `idea_joined` | Fires when a user joins an idea project as a contributor | `src/features/idea-details/ui/IdeaProjectActions.tsx` |
| `idea_left` | Fires when a user leaves an idea project | `src/features/idea-details/ui/IdeaProjectActions.tsx` |
| `comment_submitted` | Fires when a user submits a comment or reply in a discussion thread | `src/features/discussion/ui/CommentInputArea.tsx` |
| `search_performed` | Fires when a user performs a search query of at least 3 characters | `src/features/search/ui/GlobalSearchPage.tsx` |
| `entity_liked` | Fires when a user likes an idea or problem | `src/shared/ui/LikeButton.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://eu.posthog.com/project/205155/dashboard/759997)
- [New Signups & Logins](https://eu.posthog.com/project/205155/insights/nujOEUkN)
- [Content Creation](https://eu.posthog.com/project/205155/insights/VfZhsVSg)
- [Engagement — Comments & Likes](https://eu.posthog.com/project/205155/insights/gQ4rySxJ)
- [Idea Project Joins](https://eu.posthog.com/project/205155/insights/aqLF3bZb)
- [Search Activity](https://eu.posthog.com/project/205155/insights/Xr3Jy60X)

## Verify before merging

- [ ] Run a full production build (`yarn build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` and `VITE_PUBLIC_POSTHOG_HOST` to `.env.example` and any onboarding scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — currently only email login and registration identify the user on fresh sign-in. Google OAuth users are identified only on next email login; consider adding `identify` in `AuthSessionSync` for complete coverage.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
