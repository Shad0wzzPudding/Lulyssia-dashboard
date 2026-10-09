# Lulyssia stickers

Lulyssia's sticker set and every place it appears in the dashboard. The images are in `src/assets/emote/` (lossless WebP, 512px max), and the toast lines are in `src/lib/stickers.ts`.

## Where stickers appear

| Place | How the sticker is picked | Source |
|---|---|---|
| Welcome greeting (Home) | One random greeting per page load, each with its own sticker | `WelcomeMessage.tsx` |
| Confirm dialog (delete, clear…) | A new random line and sticker each time the dialog opens | `LulyssiaConfirmDialog.tsx` |
| Toasts: success | Random line from the **success** set, with a sticker beside the message and her line under it | `lib/toast.tsx`, `ui/toaster.tsx` |
| Toasts: error | Random line from the **error** set | same |
| Toasts: info / plain | A sticker from the **info** set. A plain toast that is already in her voice gets the sticker only. | same |
| "Collapse all" with nothing open | Always `no` | `HomePage.tsx` |
| Back-to-top skill toast | Always `trigger_chibi` (its own layout) | `Index.tsx` |

Toasts that already have a description (for example "Select the code and copy it manually.") keep that text and get only the sticker, so useful information is never replaced.

## The stickers

### yes
<img src="../src/assets/emote/lulyssia_yes.webp" width="110">

- **Greeting:** "Oh, {nickname}. Right on time, as I expected." 🦋
- **Success toast:** "Good. Exactly as I deduced." / "Nicely done. You have my approval~"

### coffee
<img src="../src/assets/emote/lulyssia_coffee.webp" width="110">

- **Greeting:** "Coffee's ready. So is your agenda." ☕
- **Confirm dialog:** "Let me finish my coffee before you decide."
- **Success toast:** "Filed away. Now, where was my coffee..." / "Noted over a sip of coffee ☕"

### contemplate
<img src="../src/assets/emote/lulyssia_contemplate.webp" width="110">

- **Greeting:** "Welcome back. I've already looked over today's case." 🔍
- **Confirm dialog:** "Hmm... let me consider this for a moment."
- **Info toast:** "Hmm... interesting."

### suspicious
<img src="../src/assets/emote/lulyssia_suspicious.webp" width="110">

- **Greeting:** "Hmm... you look like you're hiding an unfinished task." 👀
- **Confirm dialog:** "Are you really sure about this?"
- **Error toast:** "Suspicious... that should have worked."
- **Info toast:** "I'll keep an eye on it."

### polaroid
<img src="../src/assets/emote/lulyssia_polaroid.webp" width="110">

- **Greeting:** "I took a snapshot of your progress. Let's add to it." 📸
- **Confirm dialog:** "Let me take a picture first, just in case."
- **Success toast:** "Snap. Logged as evidence."
- **Info toast:** "I'll remember that."

### ritualing
<img src="../src/assets/emote/lulyssia_ritualing.webp" width="110">

- **Greeting:** "Hold on, the files are almost sorted... there. Welcome back." 📜
- **Success toast:** "All in order. I checked twice."
- **Info toast:** "Leave the rest to me."

### restpointing
<img src="../src/assets/emote/lulyssia_restpointing.webp" width="110">

- **Greeting:** "There you are! Your tasks won't finish themselves, you know." 👉
- **Confirm dialog:** "Hold on, {nickname}."
- **Success toast:** "See? That wasn't so hard."
- **Info toast:** "Just so you know~"

### resting
<img src="../src/assets/emote/lulyssia_resting.webp" width="110">

- **Greeting:** "Taking it slow today? I don't mind keeping you company." 🌙
- **Info toast:** "Noted~"

### mocking
<img src="../src/assets/emote/lulyssia_mocking.webp" width="110">

- **Greeting:** "Back already? Hmhm~ couldn't stay away?" 😏
- **Confirm dialog:** "Hmhm~ hope you won't regret this."
- **Success toast:** "Hmhm~ took you long enough."

### trigger_chibi
<img src="../src/assets/emote/lulyssia_trigger_chibi.webp" width="110">

- **Success toast:** "Case closed 🦋"
- **Back-to-top skill toast:** "Skill activated" plus a random line, e.g. "Too slow~ I'm already at the top."

### sleep
<img src="../src/assets/emote/lulyssia_sleep.webp" width="110">

- **Greeting:** "Mm... oh, you're here. I was only resting my eyes." 💤

### sleep_annoyed
<img src="../src/assets/emote/lulyssia_sleep_annoyed.webp" width="110">

- **Greeting:** "Five more minutes... fine. Let's get to work." 😤
- **Confirm dialog:** "You woke me up for this? Fine, decide."
- **Error toast:** "Ugh. Wake me when the server behaves."

### startle
<img src="../src/assets/emote/lulyssia_startle.webp" width="110">

- **Greeting:** "Wha-! Oh, it's just you. Hi, {nickname}." ❗
- **Confirm dialog:** "Wha-! You're doing what?"
- **Error toast:** "Wha-! Something went wrong!"

### objection
<img src="../src/assets/emote/lulyssia_objection.webp" width="110">

- **Greeting:** "Objection! You said you'd come back earlier." 💢
- **Confirm dialog:** "Objection! Think this through first."
- **Error toast:** "Objection! That was refused."

### no
<img src="../src/assets/emote/lulyssia_no.webp" width="110">

- **Greeting:** "Skipping your tasks today? No. Absolutely not." 🙅
- **Confirm dialog:** "I'd rather you didn't... but it's your call."
- **Error toast:** "Nope. That one didn't go through."
- **"Collapse all" pout:** "Hmph! I can't collapse anything — every block is already closed! Expand at least one first, okay?"

### unconfident
<img src="../src/assets/emote/lulyssia_unconfident.webp" width="110">

- **Greeting:** "Um... I think I planned today well? Take a look." 😥
- **Confirm dialog:** "Um... are we sure this is a good idea?"
- **Error toast:** "Um... I may have dropped that one."

### notsochill
<img src="../src/assets/emote/lulyssia_notsochill.webp" width="110">

- **Greeting:** "Too many deadlines in my head... help me clear a few, {nickname}?" 💭
- **Confirm dialog:** "Too many choices... just confirm it, okay?"
- **Error toast:** "Too much at once... give it a moment and try again."

## Example toasts

How a toast looks with her added. The **bold** text is the app's own message; the *italic* line is Lulyssia's.

| Action | Sticker (random) | Toast |
|---|---|---|
| Create a task | <img src="../src/assets/emote/lulyssia_yes.webp" width="48"> | **Task created successfully!**<br>*Good. Exactly as I deduced.* |
| Update an event | <img src="../src/assets/emote/lulyssia_polaroid.webp" width="48"> | **Event updated successfully!**<br>*Snap. Logged as evidence.* |
| Delete a tag | <img src="../src/assets/emote/lulyssia_coffee.webp" width="48"> | **Tag deleted**<br>*Filed away. Now, where was my coffee...* |
| Save fails | <img src="../src/assets/emote/lulyssia_sleep_annoyed.webp" width="48"> | **Failed to update task. Please try again.**<br>*Ugh. Wake me when the server behaves.* |
| Upload too big | <img src="../src/assets/emote/lulyssia_objection.webp" width="48"> | **photo.png exceeds 25MB**<br>*Objection! That was refused.* |
| Wrong password | <img src="../src/assets/emote/lulyssia_startle.webp" width="48"> | **Invalid login credentials**<br>*Wha-! Something went wrong!* |
| Bulk pin interests | <img src="../src/assets/emote/lulyssia_restpointing.webp" width="48"> | **3 interest(s) pinned**<br>*See? That wasn't so hard.* |
| Copy LINE code | <img src="../src/assets/emote/lulyssia_mocking.webp" width="48"> | **Copied**<br>Link code copied to clipboard. *(own description kept)* |
| "Request Lulyssia help" sort | <img src="../src/assets/emote/lulyssia_ritualing.webp" width="48"> | Target locked on the deadlines! Sorted and ready, {nickname}! 🎯 *(already her voice, sticker only)* |
| iOS install hint | <img src="../src/assets/emote/lulyssia_contemplate.webp" width="48"> | **Install on iOS**<br>Tap the share button in Safari, then 'Add to Home Screen'. |

## Adding a sticker or line

1. Convert the art to a lossless WebP in `src/assets/emote/`: `cwebp -lossless -z 9 in.png -o lulyssia_name.webp (add -resize 512 0 when the art is bigger than 512px)`
2. Add it to `STICKERS` in `src/lib/stickers.ts`.
3. Use it in `TOAST_LINES` (success / error / info), in the greetings in `WelcomeMessage.tsx`, or in the dialog lines in `LulyssiaConfirmDialog.tsx`. `{nickname}` is replaced with the user's saved nickname.
