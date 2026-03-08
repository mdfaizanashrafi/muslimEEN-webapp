# Implementation Plan - MuslimEEN UI Fixes

> **Following LinkedIn Patterns with SRP & Proper Naming**

---

## Phase 1: Create Missing Pages (Foundation)
**Files to Create:**
- `app/trust-score/page.tsx` - Trust Score details page
- `app/settings/page.tsx` - Settings page with sections
- `app/settings/layout.tsx` - Settings layout with sidebar

**Testing:** Verify pages render without errors

---

## Phase 2: Profile - Edit Profile Functionality
**Files to Modify:**
- `app/profile/page.tsx` - Full edit profile modal with sections
- `components/profile/EditProfileModal.tsx` - Reusable edit modal
- `components/profile/sections/PersonalInfoForm.tsx` - Personal info editing
- `components/profile/sections/AboutForm.tsx` - About section editing
- `components/profile/sections/ExperienceForm.tsx` - Work experience editing
- `components/profile/sections/EducationForm.tsx` - Education editing
- `components/profile/sections/SkillsForm.tsx` - Skills editing

**LinkedIn Features:**
- Modal with tabs for each section
- Auto-save for each field
- Profile preview while editing
- Progress indicator

---

## Phase 3: Profile - Share Profile Functionality
**Files to Create:**
- `components/profile/ShareProfileModal.tsx` - Share options modal
- `components/profile/ShareOptions/CopyLink.tsx` - Copy profile URL
- `components/profile/ShareOptions/QRCode.tsx` - Generate QR code
- `components/profile/ShareOptions/EmailShare.tsx` - Email sharing
- `components/profile/ShareOptions/SocialShare.tsx` - Social media buttons

**Features:**
- Copy link to clipboard
- QR code generation
- Privacy settings toggle (public/private)

---

## Phase 4: Trust Score Details Page
**Files to Create:**
- `app/trust-score/page.tsx` - Main trust score page
- `components/trust-score/ScoreHistory.tsx` - Score history graph
- `components/trust-score/ScoreFactors.tsx` - Breakdown of factors
- `components/trust-score/ComparisonWithConnections.tsx` - Compare with connections
- `components/trust-score/ImprovementSuggestions.tsx` - Actionable tips

**Features:**
- Score history chart (last 6 months)
- Factor breakdown (profile, connections, verification, etc.)
- Comparison percentile with connections
- Personalized improvement suggestions

---

## Phase 5: Business Verification (Coming Soon)
**Files to Create:**
- `app/verification/business/page.tsx` - Business verification page
- `app/verification/business/types.ts` - Type definitions
- `app/verification/business/constants.ts` - Constants & validation rules
- `components/verification/business/BusinessForm.tsx` - Placeholder form structure
- `components/verification/business/DocumentUpload.tsx` - Placeholder for docs
- `components/verification/business/ReviewStatus.tsx` - Status tracking UI

**Structure (for future implementation):**
```typescript
// TODO: Future Implementation Guide
// 1. Multi-step form: Business Info → Documents → Review → Submit
// 2. Required fields: businessName, registrationNumber, taxId, address
// 3. Documents: businessLicense, taxCertificate, bankStatement
// 4. Admin review workflow: Pending → UnderReview → Approved/Rejected
// 5. Webhook notifications on status change
```

---

## Phase 6: Institutional Partner Application
**Files to Create:**
- `app/verification/institutional/page.tsx` - Institutional application page
- `app/verification/institutional/types.ts` - Types for institutions
- `components/verification/institutional/InstitutionTypeSelector.tsx` - Select type
- `components/verification/institutional/MosqueForm.tsx` - Mosque-specific fields
- `components/verification/institutional/MadrasaForm.tsx` - Madrasa-specific fields
- `components/verification/institutional/OrganizationForm.tsx` - Organization fields
- `components/verification/institutional/VerificationDocuments.tsx` - Document upload

**Institution Types:**
1. **Mosque:** Name, Address, Imam name, Registration number, Capacity
2. **Madrasa:** Name, Address, Principal name, Curriculum type, Student count
3. **Organization:** Name, Type (NGO, Charity, etc.), Registration, Mission

**Verification Info (like other platforms):**
- Official registration documents
- Tax exemption certificate (if applicable)
- Bank account in organization's name
- Physical address verification
- Website/social media presence

---

## Phase 7: Settings Page (LinkedIn-style)
**Files to Create:**
- `app/settings/page.tsx` - Main settings page
- `app/settings/layout.tsx` - Settings layout with navigation
- `components/settings/SettingsNav.tsx` - Settings sidebar navigation
- `components/settings/AccountSettings.tsx` - Email, password, deletion
- `components/settings/PrivacySettings.tsx` - Profile visibility, messaging
- `components/settings/NotificationSettings.tsx` - Email & push preferences
- `components/settings/SecuritySettings.tsx` - 2FA, login history
- `components/settings/AppearanceSettings.tsx` - Theme, language

**Settings Sections (LinkedIn-style):**
1. **Account preferences** - Email, password, language
2. **Sign in & security** - Password change, 2FA, active sessions
3. **Visibility** - Profile visibility, who can see connections
4. **Notifications** - Email frequency, push notifications
5. **Data privacy** - Download data, account deletion

---

## Naming Conventions

### Files
- Components: `PascalCase.tsx` (e.g., `EditProfileModal.tsx`)
- Pages: `page.tsx` in `kebab-case` folder (e.g., `trust-score/page.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Types: `PascalCase.ts` or `.d.ts` (e.g., `Profile.types.ts`)

### Components
- Container components: `*Page.tsx` or `*Layout.tsx`
- Presentational components: `*.tsx` with descriptive names
- Hooks: `useCamelCase.ts` (e.g., `useProfileEdit.ts`)

### Functions
- Event handlers: `handleEventName` (e.g., `handleSaveProfile`)
- API calls: `actionResource` (e.g., `updateProfile`)
- Utilities: `verbNoun` (e.g., `formatDate`, `validateEmail`)

---

## SRP Principles

1. **One Component = One Responsibility**
   - `PersonalInfoForm` only handles personal info
   - `ExperienceForm` only handles work experience
   - `ShareProfileModal` only handles sharing logic

2. **Separate Container & Presentational Components**
   - Containers: Fetch data, handle state
   - Presentational: Receive props, render UI

3. **Custom Hooks for Reusable Logic**
   - `useProfileEdit` - Profile editing logic
   - `useTrustScore` - Trust score data fetching
   - `useShareProfile` - Share functionality

4. **Utility Functions in Separate Files**
   - `lib/profile/validation.ts` - Profile validation
   - `lib/share/generateQRCode.ts` - QR code generation
   - `lib/settings/formatters.ts` - Settings formatters

---

## Testing After Each Phase

After each phase:
1. ✅ Build succeeds (`npm run build`)
2. ✅ No TypeScript errors
3. ✅ Pages load without 404 errors
4. ✅ Buttons are clickable
5. ✅ Modals open/close correctly
6. ✅ Forms validate properly

---

## Execution Order

1. **Phase 1** → Create missing pages (trust-score, settings)
2. **Phase 2** → Edit Profile functionality
3. **Phase 3** → Share Profile functionality
4. **Phase 4** → Trust Score details page
5. **Phase 5** → Business Verification (Coming Soon)
6. **Phase 6** → Institutional Partner application
7. **Phase 7** → Settings page

**Start with Phase 1?** (Reply "yes" to begin)
