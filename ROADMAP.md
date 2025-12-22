# Autopsy Roadmap

This document tracks planned features, improvements, and the long-term vision for Autopsy.

## Version History

### v0.9.0 (Initial Release)
- Basic tab analysis and display
- Status indicators (Active, Recent, Idle, Dead)
- Age-based filtering
- Bulk close functionality

### v0.10.0 (Current) - UX Improvements
- ✅ Select-all checkbox in table header
- ✅ Row click focuses tabs (checkbox for selection)
- ✅ Status legend below table
- ✅ Confirmation dialogs for bulk closes (>5 tabs)
- ✅ Auto-refresh every 10 seconds
- ✅ "Updated X ago" timestamp display
- ✅ Empty state messaging
- ✅ Configurable custom age filter
- ✅ Persistent URL-based tab age tracking
- ✅ Removed unreliable Memory column

---

## v0.11.0 - Search & Navigation (Next Release)

### Search & Discovery
- [ ] **Search/filter tabs by name or URL** - Quick find specific tabs
- [ ] **Highlight search matches** - Visual indication in table
- [ ] **Search keyboard shortcut** - Focus search with Cmd/Ctrl+F

### Keyboard Navigation
- [ ] **Del key** - Close selected tabs
- [ ] **Ctrl+A / Cmd+A** - Select all tabs
- [ ] **Arrow keys** - Navigate table rows
- [ ] **Space** - Toggle selection on focused row
- [ ] **Enter** - Focus tab from focused row
- [ ] **Escape** - Clear selection / close search
- [ ] **Visible focus indicators** - Show keyboard focus clearly

### Undo Functionality
- [ ] **Undo close toast** - 5-second undo notification after closing tabs
- [ ] **Recently closed list** - View and restore recently closed tabs
- [ ] **Undo keyboard shortcut** - Ctrl+Z / Cmd+Z to undo close

### Polish
- [ ] **Remove "Opened" column** - Redundant with Age column
- [ ] **Rename "Age" to "Tab Age"** - More descriptive
- [ ] **Show "0" instead of "—"** - For zero requests
- [ ] **Add Data column tooltip** - Explain what bytes transferred means

---

## v0.12.0 - Accessibility & Refinement

### Accessibility
- [ ] **Shape/icon variants for status** - Don't rely only on color
  - Active: ● (solid circle)
  - Recent: ◆ (diamond)
  - Idle: ■ (square)
  - Dead: ✕ (x)
- [ ] **WCAG contrast audit** - Ensure all text meets AA standards
- [ ] **Screen reader support** - Proper ARIA labels
- [ ] **Keyboard-only navigation testing** - Full app usable without mouse
- [ ] **Reduced motion support** - Honor prefers-reduced-motion

### Visual Polish
- [ ] **Reduce header visual weight** - Make stats less prominent
- [ ] **Better section separation** - Visual hierarchy improvements
- [ ] **Responsive width option** - User-configurable or adaptive
- [ ] **Dark/light theme toggle** - User preference (currently dark-only)

### Data Quality
- [ ] **Better age tracking heuristics** - Improve accuracy for reopened tabs
- [ ] **Detect suspended/discarded tabs** - Indicate tabs Chrome has unloaded
- [ ] **Show tab groups** - Display Chrome's native tab groups

---

## v1.0.0 - Power User Features

### Grouping & Organization
- [ ] **Group by domain** - Collapse tabs from same site
- [ ] **Group by window** - Show which window tabs belong to
- [ ] **Group by status** - Active/Recent/Idle/Dead sections
- [ ] **Collapsible groups** - Expand/collapse sections
- [ ] **Sort groups** - Order by tab count, memory, age, etc.

### Bulk Operations
- [ ] **Select by domain** - "Select all github.com tabs"
- [ ] **Select by age range** - More granular than filter
- [ ] **Close duplicates** - Find and close duplicate URLs
- [ ] **Pin/unpin selected** - Bulk pin operation
- [ ] **Move to new window** - Extract selected tabs

### Export & Sharing
- [ ] **Export to CSV** - Tab list with all metadata
- [ ] **Export to Markdown** - Formatted list with links
- [ ] **Copy URLs** - Clipboard export of selected tab URLs
- [ ] **Save tab sessions** - Named collections for later restore
- [ ] **Share analysis** - Generate shareable report

### Analytics & Insights
- [ ] **Tab usage statistics** - Most visited, longest open, etc.
- [ ] **Domain breakdown** - Tabs per domain chart
- [ ] **Memory trends over time** - If/when API improves
- [ ] **Dead tab warnings** - Proactive notifications
- [ ] **Recommendations** - AI-suggested tabs to close

---

## v1.1.0+ - Advanced Features

### Settings & Customization
- [ ] **Settings panel** - Persistent user preferences
- [ ] **Configurable auto-refresh** - Adjust interval (10s default)
- [ ] **Confirmation thresholds** - Customize when to show warnings
- [ ] **Column visibility toggles** - Show/hide specific columns
- [ ] **Custom status thresholds** - Define Active/Recent/Idle/Dead times
- [ ] **Theme customization** - Colors, fonts, density

### Performance
- [ ] **Virtualized table** - Handle 1000+ tabs efficiently
- [ ] **Lazy loading** - Load tab data on demand
- [ ] **Optimistic updates** - Instant UI feedback
- [ ] **Background sync** - Update data without blocking UI

### Automation
- [ ] **Auto-close rules** - "Close tabs Dead for >7 days"
- [ ] **Scheduled cleanup** - Run rules on schedule
- [ ] **Whitelist/blacklist** - Never close certain domains
- [ ] **Tab limits** - Warn when approaching limit

### Integration
- [ ] **Sync across devices** - Chrome sync for preferences
- [ ] **Import from other tools** - OneTab, Tab Wrangler, etc.
- [ ] **Export to bookmarks** - Save as bookmark folder
- [ ] **Cloud backup** - Tab session history

---

## Known Issues & Limitations

### Current Limitations
- **Tab age accuracy**: Tracked from extension start, not actual tab creation (Chrome API limitation)
- **Memory data unreliable**: Chrome processes API doesn't always provide per-tab memory
- **URL-based age**: Multiple tabs with same URL share age timestamp
- **No cross-window awareness**: Each window tracked independently
- **Extension restart**: Loses in-memory network stats

### Potential Improvements
- Use Chrome history API to estimate tab age
- Store network stats in chrome.storage for persistence
- Add tab fingerprinting (URL + window + index) for better tracking
- Detect tab duplication across windows

---

## Community Requests

Track user-requested features here:

- [ ] TBD - No user requests yet

---

## Technical Debt

### Code Quality
- [ ] Add unit tests (0% coverage currently)
- [ ] Add E2E tests with Puppeteer
- [ ] Refactor popup.tsx (360+ lines, needs splitting)
- [ ] Add error boundaries
- [ ] Add loading states for all async operations
- [ ] Improve TypeScript strictness

### Performance
- [ ] Audit bundle size
- [ ] Code splitting for large features
- [ ] Debounce filter inputs
- [ ] Optimize re-renders

### Documentation
- [ ] Add JSDoc comments
- [ ] Architecture documentation
- [ ] Contributing guidelines
- [ ] User documentation / FAQ

---

## Long-Term Vision

**Mission**: Make tab management effortless and data-driven.

**Goals**:
1. **Transparency**: Users understand why tabs are open and what they're doing
2. **Control**: Powerful tools to organize, filter, and manage at scale
3. **Intelligence**: Smart recommendations based on usage patterns
4. **Speed**: Fast, responsive, never slows down browser
5. **Accessibility**: Usable by everyone, regardless of ability

**Success Metrics**:
- Users close 30%+ more unused tabs
- Average tab count decreases by 40%
- 90%+ of operations completed via keyboard
- 4.5+ star rating on Chrome Web Store
- 10,000+ active users

---

## Release Schedule

- **v0.11.0**: ~2-3 weeks (Search & Navigation)
- **v0.12.0**: ~3-4 weeks (Accessibility)
- **v1.0.0**: ~6-8 weeks (Power Features)

Releases follow semantic versioning:
- **Major (1.0)**: Breaking changes or significant new features
- **Minor (0.x)**: New features, backward compatible
- **Patch (0.0.x)**: Bug fixes, minor improvements

---

## Contributing

See issues labeled:
- `good-first-issue` - Easy entry points
- `help-wanted` - Community help needed
- `v0.11.0`, `v0.12.0`, etc. - Version milestones

Each roadmap item will have a corresponding GitHub issue for discussion and implementation tracking.
