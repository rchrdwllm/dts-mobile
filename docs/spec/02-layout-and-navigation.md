# Specification: Layout & Navigation (Single-Screen)

## Problem Statement
The default Expo Router template includes a tab bar navigator (`AppTabs`) and an `explore.tsx` page. A single-screen QR scanner app must have no tabs, drawer, or complex sub-page routing, as it causes unnecessary navigation states and clutter.

## Solution
Transition the app navigation from the custom tabs navigator to a basic Expo Router `<Stack>` navigator. Remove the exploration tab and all tab icon assets, configuring the default entry page as a full-screen container in `src/app/index.tsx`.

## User Stories
1. As a mobile operator, I want to see a single, focused screen upon launching the app so that I do not get confused by tabs or extra navigation panels.

## Implementation Decisions
* **Layout Structure**: Modify [src/app/_layout.tsx](file:///c:/Users/rwill/Documents/Projects/QRScannerGDrive/src/app/_layout.tsx) to render `<Stack screenOptions={{ headerShown: false }} />` instead of `<AppTabs />`.
* **File Cleanup**:
  * Delete [src/app/explore.tsx](file:///c:/Users/rwill/Documents/Projects/QRScannerGDrive/src/app/explore.tsx).
  * Delete [src/components/app-tabs.tsx](file:///c:/Users/rwill/Documents/Projects/QRScannerGDrive/src/components/app-tabs.tsx) and its web-specific counterpart.
* **Entry screen skeleton**: Reset [src/app/index.tsx](file:///c:/Users/rwill/Documents/Projects/QRScannerGDrive/src/app/index.tsx) to export a basic native `<View>` wrapper with an placeholder header and background styling.

## Testing Decisions
* **Manual Verification**: Run the app locally on a simulator and verify that no bottom navigation tab bar appears.
* **Type & Lint Checks**: Run typechecking (`bunx tsc --noEmit`) and lint checks (`bunx expo lint`) to verify that no broken imports exist.

## Out of Scope
* Input fields, camera configurations, and Google Sign-in controls (only layout structure).

## Further Notes
* None.
