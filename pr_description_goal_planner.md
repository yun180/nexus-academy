# Deploy goal planner PLUS restriction removal to production

This PR deploys the goal planner PLUS restriction removal changes to production by merging them into the main branch.

## Changes Made
- ✅ Removed PLUS restriction checks from goal planner frontend (page.tsx)
- ✅ Removed PLUS validation from goal planner API endpoint (route.ts)  
- ✅ Updated AI page to navigate directly to goal planner
- ✅ Enabled goal planner functionality for all authenticated users

## Technical Details
- Follows same pattern as material recommendation restriction removal
- All changes tested locally and working without restrictions
- No lint errors introduced
- 3 files modified: 6 lines added, 41 lines deleted (restriction code removal)

## Production Impact
This resolves the issue where production (https://nexus-academy-chi.vercel.app/goal-planner) still shows PLUS restrictions even though they were removed in the codebase.

## Files Changed
- `src/app/goal-planner/page.tsx` - Removed PLUS restriction UI and form validation
- `src/app/api/goal-planner/route.ts` - Removed PLUS subscription requirement from API
- `src/app/ai/page.tsx` - Updated goal planner button to navigate directly

## Verification Steps
After deployment, verify:
1. Visit https://nexus-academy-chi.vercel.app/goal-planner
2. Confirm no "PLUS限定機能" restriction message appears
3. Test goal planner form submission works for all users
4. Verify AI page goal planner button works without restrictions

Link to Devin run: https://app.devin.ai/sessions/3899da5d51e144fd8840e0f3dd849edc
Requested by: @yun180
