# Authentication & Redirect Testing Guide

## Overview
This document provides **step-by-step verification** for all authentication and role-based redirect flows in GeoHome. The goal is to confirm that all redirects use Next.js client-side navigation (`router.push`/`router.replace`) without hard page reloads, with pragmatic fallbacks where needed.

---

## Navigation Verification Strategy

### What indicates a **successful SPA redirect** (NO hard reload):
- ✅ URL changes smoothly without a full page refresh
- ✅ Browser back button works as expected
- ✅ Network tab shows **no full page load** (only API calls, not HTML document request)
- ✅ Console does **not** show "Navigation to X initiated by Window.location"
- ✅ Page state (scroll position, form data) may reset, but that's normal for new pages

### What indicates a **hard redirect** (fallback triggered):
- ⚠️ Page reloads (you'll see a brief flicker)
- ⚠️ Console shows `window.location.href` log entry
- ⚠️ Network tab shows full HTML document request for the target page
- ⚠️ This means `router.push` timed out and fallback was used

---

## Test Matrix

### 1. Login Flow Tests

#### 1.1: Landlord Login
**Steps:**
1. Go to `/login`
2. Enter a landlord's email & password
3. Click "Login"
4. Observe redirect behavior

**Expected Result:**
- ✅ Redirects to `/dashboard` (smooth SPA navigation, no reload)
- ✅ Console shows: `Navigating to /dashboard`
- ✅ No `window.location.href` entry in console
- ✅ Network tab shows API calls to profiles table, **not** full page refresh

**If hard redirect is triggered:**
- ⚠️ Console shows: `router.push did not complete navigation, falling back to window.location.href`
- ⚠️ Page reloads (1.5s timeout triggered)
- **Action:** Report to Vercel support; may need Next.js version investigation

---

#### 1.2: Agent Login
**Steps:**
1. Go to `/login`
2. Enter an agent's email & password
3. Click "Login"

**Expected Result:**
- ✅ Redirects to `/agent` (smooth SPA navigation)
- ✅ Console shows: `Navigating to /agent`
- ✅ No hard reload

---

#### 1.3: Admin Login
**Steps:**
1. Go to `/login`
2. Enter an admin's email & password
3. Click "Login"

**Expected Result:**
- ✅ Redirects to `/admin` (smooth SPA navigation)
- ✅ Console shows: `Navigating to /admin`
- ✅ No hard reload

---

#### 1.4: Tenant Login
**Steps:**
1. Go to `/login`
2. Enter a tenant's email & password
3. Click "Login"

**Expected Result:**
- ✅ Redirects to `/` (homepage, stays on map; smooth SPA navigation)
- ✅ Console shows: `Navigating to /`
- ✅ No hard reload

---

### 2. Protected Route Tests

#### 2.1: Unauthenticated User Tries to Access `/dashboard`
**Steps:**
1. Clear cookies / log out
2. Go directly to `/dashboard`

**Expected Result:**
- ✅ Redirects to `/login` (smooth SPA navigation or server-side redirect)
- ✅ User can log in from `/login`

---

#### 2.2: Logged-in Tenant Tries to Access `/dashboard`
**Steps:**
1. Log in as tenant
2. Navigate to `/dashboard` (or try via URL bar)

**Expected Result:**
- ✅ ProtectedRoute wrapper redirects to `/` (tenant's home)
- ✅ Smooth SPA navigation, no hard reload

---

#### 2.3: Logged-in Landlord Tries to Access `/agent`
**Steps:**
1. Log in as landlord
2. Try to navigate to `/agent` (via URL bar or link)

**Expected Result:**
- ✅ ProtectedRoute wrapper checks role, sees `landlord` is not in `allowedRoles: ['agent']`
- ✅ Redirects to `/dashboard` (smooth SPA navigation)
- ✅ Console shows role check in ProtectedRoute

---

### 3. Homepage Role Guard Tests

#### 3.1: Logged-in Landlord Visits Homepage
**Steps:**
1. Log in as landlord
2. Navigate to `/`

**Expected Result:**
- ✅ Homepage detects role is `landlord` (not tenant)
- ✅ Automatically redirects to `/dashboard` (via `router.replace` in useEffect)
- ✅ Smooth SPA navigation, user never sees the map

---

#### 3.2: Already Logged-in Landlord Clicks "Home" Link
**Steps:**
1. Log in as landlord
2. From `/dashboard`, click a link that goes to `/`

**Expected Result:**
- ✅ Redirects to `/dashboard` (because homepage detects role)
- ✅ User cannot stay on homepage if they're a landlord

---

### 4. Signup Flow Tests

#### 4.1: New User Signs Up
**Steps:**
1. Go to `/signup`
2. Fill in email, password, select role (e.g., "landlord")
3. Click "Sign up"

**Expected Result:**
- ✅ Account is created in Supabase
- ✅ User is redirected to `/login?message=Account created. Please log in.`
- ✅ Smooth SPA navigation
- ✅ URL shows query parameter `?message=...`
- ✅ User can then log in with the new account

---

### 5. Logout Tests

#### 5.1: User Logs Out
**Steps:**
1. Log in as any role
2. Click "Sign out" in navbar

**Expected Result:**
- ✅ Supabase session is cleared
- ✅ User is redirected to `/` (smooth SPA navigation)
- ✅ Navbar now shows "Login" / "Sign up" buttons
- ✅ If user tries to access `/dashboard`, they're redirected to `/login`

---

### 6. Middleware Tests

#### 6.1: Unauthenticated User Tries `/dashboard`
**Steps:**
1. Clear all cookies (simulate no session)
2. Try to access `/dashboard` directly (via URL bar)

**Expected Result:**
- ✅ Middleware checks for auth cookies (`sb-access-token` or `sb-session`)
- ✅ Middleware redirects to `/login` (server-side, before client loads)
- ✅ User sees `/login` page

**Note:** This is a **server-side guard**, so there's no choice between `router.push` vs `window.location` – it's just a server redirect.

---

### 7. Property Creation Tests

#### 7.1: Landlord Creates Property (New Form)
**Steps:**
1. Log in as landlord
2. Go to `/dashboard`
3. Click "Add Property" modal or "Add via full form"
4. Fill in property details
5. Click "Create property"

**Expected Result:**
- ✅ Property is saved to Supabase
- ✅ Landlord is redirected to `/properties/{id}` (with actual ID)
- ✅ Smooth SPA navigation, no hard reload
- ✅ Property detail page displays the newly created property

---

## Debug Checklist

### If any redirect uses **hard redirect** (window.location.href):

1. **Check browser console:**
   ```
   router.push did not complete navigation, falling back to window.location.href
   ```

2. **Check Network tab:**
   - Look for a full HTML document request (e.g., `/dashboard`)
   - If present, hard redirect was triggered

3. **Check timing:**
   - If redirect happens > 1.5 seconds after login, it's the fallback
   - If instant, it's likely just the normal page load

4. **Reproduction steps:**
   - Note the exact flow (login as X, redirect to Y)
   - Test in both development (`npm run dev`) and production (Vercel)
   - Check browser/OS (Chrome, Safari, mobile, etc.)

5. **Next steps if hard redirect is used:**
   - Record console logs
   - Note which role (landlord, agent, admin, tenant)
   - Check if Supabase profile fetch succeeded (look for `Profile found, role:` log)
   - Report to dev team with reproduction steps

---

## Expected Console Output

### Successful Login as Landlord (with SPA navigation):
```
Attempting sign in with: landlord@example.com
Auth successful, user ID: 12345
Profile found, role: landlord
Redirecting based on role: landlord
Navigating to /dashboard
[Page navigates smoothly to /dashboard]
```

### Failed Navigation with Fallback:
```
Attempting sign in with: landlord@example.com
Auth successful, user ID: 12345
Profile found, role: landlord
Redirecting based on role: landlord
Navigating to /dashboard
[No navigation happens...]
[1.5 seconds pass]
router.push did not complete navigation, falling back to window.location.href
[Page reloads with hard redirect]
```

---

## Production Checklist

Before going live on Vercel:

- [ ] Test login as landlord → `/dashboard` (no hard reload)
- [ ] Test login as agent → `/agent` (no hard reload)
- [ ] Test login as admin → `/admin` (no hard reload)
- [ ] Test login as tenant → `/` (no hard reload)
- [ ] Test already-logged-in landlord visits `/` → auto-redirects to `/dashboard`
- [ ] Test unauthenticated user tries `/dashboard` → redirects to `/login`
- [ ] Test wrong-role access (landlord tries `/agent`) → redirects to `/dashboard`
- [ ] Test logout → redirects to `/`, can log in again
- [ ] Test signup flow → redirects to `/login?message=...`
- [ ] Test property creation → redirects to `/properties/{id}` with correct ID
- [ ] Test on mobile browser (Safari, Chrome mobile)
- [ ] Check Network tab for full page reloads (should be minimal)
- [ ] Check console for any `window.location.href` fallback messages
- [ ] Verify middleware doesn't conflict (test via hard refresh of `/dashboard` when logged in)

---

## Troubleshooting

### Symptom: Hard reload on login
**Likely cause:** `router.push` is not navigating within 1.5 seconds (fallback triggered).
**Solution:** 
- Check browser console for warning message
- Verify Supabase auth session is established (check cookies)
- Test in production Vercel URL, not just localhost
- May indicate Next.js version incompatibility or router state issue

### Symptom: Middleware redirects conflict with client redirects
**Likely cause:** Middleware is redirecting too aggressively.
**Solution:**
- Middleware should only redirect unauthenticated users to `/login`
- Middleware should NOT redirect based on role (that's client-side)
- Check middleware.ts: it should check for auth cookies, not role

### Symptom: Back button behavior is wrong
**Likely cause:** Using `router.replace` everywhere instead of `router.push`.
**Solution:**
- `router.replace`: Don't add to history (use for redirects after action, e.g., post-login)
- `router.push`: Add to history (use for normal navigation, e.g., clicking a link)
- Current code uses `router.replace` for role-based redirects, which is intentional (prevents back button to login)

---

## Vercel-Specific Notes

- **Environment variables:** Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel dashboard.
- **Build:** Run `npm run build` locally before pushing to ensure no build errors.
- **Edge Functions:** If Vercel Edge Middleware is used, ensure it doesn't interfere with client-side routing.
- **Cookies:** Vercel preserves cookies between redirects, so Supabase session should persist.

---

## Summary

| Flow | Expected Navigation | Method | Expected Speed |
|------|----------------------|--------|-----------------|
| Login (all roles) | To role-specific page | `router.push()` or fallback | Instant (< 100ms) |
| Signup | To `/login` | `router.push()` | Instant |
| Homepage guard | Non-tenants to dashboard | `router.replace()` | Instant |
| ProtectedRoute deny | To appropriate page | `router.replace()` | Instant |
| Logout | To `/` | `router.push()` | Instant |
| Property creation | To `/properties/{id}` | `router.push()` | Instant |
| Hard redirect fallback | To target page | `window.location.href` | 1.5 seconds (only if SPA fails) |

All redirects should be **smooth SPA navigation** with no page reload. Hard redirects are a **fallback only** for edge cases.
