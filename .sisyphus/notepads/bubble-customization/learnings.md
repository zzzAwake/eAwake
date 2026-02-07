TASK: Documented bubble settings schema derivation and merge helpers.
1. Recorded that bubble text defaults mirror CSS `--user-bubble-color`/`--ai-bubble-color` and voice colors follow plan values #2ba245 / #ffffff.
2. Captured merge helper rationale: clone gradient stops before merging overrides to keep defaults immutable.

TASK 5: CSS Rendering Integration
1. Integration Strategy:
   - Used a dynamic `<style>` tag (`#current-chat-bubble-style`) injected into `head`
   - This approach allows targeting pseudo-elements (voice triangles `::after`) which inline styles cannot do
   - Single style tag strategy avoids DOM pollution when switching chats

2. Key Implementation Details:
   - Hooked into `openChat(chatId)` to call `applyBubbleStyles(chatId)`
   - Used `!important` in generated CSS to override existing theme styles
   - Handled text bubbles (gradient/solid, border, shadow, opacity)
   - Handled voice bubbles (background, waveform color via `currentColor`, duration text)
   - Added specific CSS rules for dark mode AI voice bubbles

3. Verification:
   - Confirmed function call placement in `openChat`
   - Verified CSS generation logic covers all required properties
   - Ensured voice message pseudo-elements are correctly targeted

2. Technical Details:
   - Gradient Data Structure: `{ enabled, type, angle, stops: [{color, position}] }`
   - Auto-save: Leveraged existing `debouncedSaveBubbleSettings` to persist changes without spamming IndexedDB.

3. Issues:
   - Playwright Environment: Failed to launch browser due to root/sandbox issues. Manual verification via code inspection was necessary.


