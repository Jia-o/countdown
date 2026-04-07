Code Review: Countdown App vs SPEC.md
Acceptance Criteria
1. [PASS] Create countdown events with name, date/time, and description app/(tabs)/add.tsx implements a full form with name (required), date picker, time picker, and optional description. Trimmed values are passed to addEvent.

2. [PASS] Display all upcoming countdowns sorted soonest to latest app/(tabs)/index.tsx lines 127–132: filters by targetDate > now and sorts ascending. Correct.

3. [PASS] Show live-updating countdown timers (days / hours / minutes / seconds) CountdownCard in index.tsx lines 53–58: a 1-second setInterval calls getTimeRemaining and updates local state. Clears on unmount. ✓

4. [PASS] Allow users to edit events index.tsx line 135 navigates to /(tabs)/add with the event id as a param. The add.tsx screen detects the id param and enters edit mode. ✓

5. [PASS] Allow users to delete events Both index.tsx (lines 138–154) and past.tsx (lines 116–132) show a confirmation Alert.alert before calling deleteEvent. ✓

6. [PASS] Automatically move expired events to Past Events index.tsx filters targetDate > now; past.tsx filters targetDate <= now. Since now is updated by a 1-second interval on the home screen and a 60-second interval on the past screen, expiration is detected live. ✓

7. [PASS] Display how long ago past events occurred past.tsx getTimeSince function (lines 19–39) computes a human-readable string. See bug finding #13 below for a logic error within it.

8. [PASS] Persist data locally using AsyncStorage contexts/EventsContext.tsx: loads on mount (lines 53–67), persists on every mutation via persistEvents (lines 69–75). ✓

9. [PASS] Three screens with correct tab navigation app/(tabs)/_layout.tsx: Countdowns, Add Event, Past Events tabs. ✓

10. [PASS] Color palette matches spec constants/Colors.ts matches all specified hex values: primary #A78BFA, secondary #F9A8D4, accents, background #FFF7FB, surface #FFFFFF, text colors, pastEvents #FCA5A5. ✓

11. [PASS] Card-based UI with rounded corners, gradients, and shadows index.tsx cards use LinearGradient, borderRadius: 20, and shadow properties. Past events use borderRadius: 18 with shadow. ✓

12. [PASS] Decorative sparkles index.tsx CountdownCard lines 70–71: two ✨ sparkle elements. past.tsx PastEventCard line 95: 🌸 sparkle. ✓

13. [PASS] Color-coded countdown cards (random pastel accent per event) EventsContext.tsx getRandomAccentColor() (lines 39–42) assigns a random accent color at creation time. CardGradients in Colors.ts maps each accent to a gradient. ✓

14. [PASS] iOS platform target / Expo environment app.json, date pickers use Platform.OS === 'ios' ? 'spinner' : 'default', tab bar has iOS-specific padding. ✓

Bugs / Logic Errors
15. [FAIL] getTimeSince returns wrong result when event crossed a calendar month boundary in under 30 days past.tsx lines 32–35: the months variable is computed using calendar month arithmetic — (now.getFullYear() - past.getFullYear()) * 12 + (now.getMonth() - past.getMonth()). This ignores the day-of-month. For example, if an event expired on January 31 and the current date is February 1, months = 1, so the function returns "1 month ago" instead of "1 day ago". The same issue applies to the years calculation at line 37 (now.getFullYear() - past.getFullYear()), which can report "1 year ago" for events only ~364 days old.

16. [FAIL] SECONDS_PER_MINUTE misused as a threshold for minutes past.tsx line 27: if (minutes < SECONDS_PER_MINUTE). The constant is 60 (seconds per minute) and it happens to equal 60 (minutes per hour), so this works numerically, but semantically the comparison should read if (minutes < 60) or use a constant named MINUTES_PER_HOUR. As written it implies minutes are being compared to a seconds constant, which is incorrect and misleading.

17. [FAIL] Edit button missing on Past Events screen past.tsx PastEventCard only renders a delete button (lines 70–77). The spec says "Allow users to edit and delete events" without limiting this to upcoming events. There is no way to edit a past event's data (e.g. fix a typo) short of deleting and re-creating it.

18. [FAIL] id is not a UUID EventsContext.tsx line 36: generateId() uses Date.now().toString(36) + Math.random().toString(36).substring(2). The spec data model specifies id: string (UUID). This is not a UUID. For correctness and interoperability, crypto.randomUUID() (available in React Native 0.73+) or a uuid library should be used.

Missing / Incomplete Features
19. [WARN] loading state is never consumed by any screen EventsContext.tsx exposes loading: boolean in the context value (line 28), but none of the three screens check it. During initial AsyncStorage load, the list will momentarily appear empty before events populate. This causes a brief flash of the empty-state UI on every app launch.

20. [WARN] Stale form data when navigating between edit sessions add.tsx lines 29–39: name, description, and targetDate are initialized from editingEvent via useState initializers (run once on mount). The reset useEffect (lines 45–54) only resets when !isEditing. If a user presses Edit on event A, navigates back without saving, then presses Edit on event B (without the component unmounting, which can happen with tab-based navigation), the form still shows event A's data because useState initializers don't re-run on param changes and the effect skips the reset path.

Code Quality Issues
21. [WARN] Dimensions.get('window') called at module level index.tsx line 17: const { width } = Dimensions.get('window'); is evaluated once at module load time. On orientation change or on iPads, this value will be stale. The React Native best practice is to use the useWindowDimensions() hook inside the component so the value stays reactive.

22. [WARN] N+1 redundant intervals on the Countdown screen index.tsx lines 122–125: the parent CountdownScreen runs a 1-second interval to update now, causing the entire screen (including all card re-renders, re-filter, re-sort) every second. Each CountdownCard also has its own 1-second interval for its local timer (lines 53–58). This means 1 + N intervals are running, and the screen does a full re-render cycle every second even though each card independently manages its own display. The screen-level interval is only needed to detect expiration, but because it updates state, it triggers O(N) extra component work per second.

23. [WARN] No validation of data parsed from AsyncStorage EventsContext.tsx lines 58–59: JSON.parse(raw) is cast directly to CountdownEvent[] with no structural validation. If the stored JSON is corrupt, has a missing field, or is from an older schema, it will silently cause runtime errors downstream (e.g., new Date(undefined) calls). A basic shape check or a try/catch at the field-access level would make this more robust.

24. [WARN] description field typed as required string instead of optional EventsContext.tsx line 15: description: string is non-optional in the CountdownEvent interface. The spec lists it as optional. While functionally empty string works, it does not match the spec's intent and means callers cannot omit the field or pass undefined/null to indicate "no description."

25. [WARN] minimumDate on the date picker creates an inconsistency with the edit-past-date confirmation dialog add.tsx line 223: minimumDate={new Date()} is applied unconditionally on the date picker, including when isEditing is true. This means a user editing an existing event cannot manually pick a date in the past — the picker prevents it. Yet lines 95–104 contain a confirmation dialog specifically for the case isPastDate && isEditing. The only way this confirmation fires is if the event was already past before editing (the user never changes the date). The whole "move to past with confirmation" UX for edits is mostly unreachable via normal UI interaction.

26. [WARN] No accessibility labels on action icon buttons index.tsx lines 78–83: the edit and delete TouchableOpacity buttons have no accessibilityLabel. Assistive technologies (VoiceOver on iOS) will announce "button" with no context. Same issue in past.tsx line 70. React Native best practice is to add accessibilityLabel="Edit event" / accessibilityLabel="Delete event".