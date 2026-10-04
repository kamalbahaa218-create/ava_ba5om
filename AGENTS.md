LOVABLE:BEGIN
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Arabic RTL app: shared page chrome and cards live in `src/components/site/`; all persistent content (topics, program, events, announcements, lessons, classes) is read from the database via hooks in `src/lib/content.ts` — no hardcoded data.
- Generic admin CRUD for content tables lives in `src/components/site/ContentManager.tsx` (config per table); writes are authorized by RLS using `has_permission`.
- Account disable/delete go through main-admin server functions in `src/lib/admin.functions.ts` (auth ban + `profiles.is_active`) — the client never calls the auth admin API.
- Attendance and leaderboard writes/reads go through SQL security-definer functions (record_attendance, get_leaderboard); QR holds only a random session token — students can never insert attendance directly.
