# Obsidian Image Organizer

This vibe-coded script will organize your Obsidian vault. Instead of having every pasted image dumped in the root directory, they’ll be moved into an `assets/` folder next to the note that references them.

## Example

### Before

```
ObsidianVault/
├── diagram.png
├── screenshot.jpg
├── meeting-notes.png
├── Projects/
│   ├── 2025 AI Project.md         ← contains ![[diagram.png]]
│   └── team-sync.md              ← contains ![[meeting-notes.png]]
├── Notes/
│   └── daily-log.md              ← contains ![[screenshot.jpg]]
```

Before running the script, all images are cluttered at the root of the vault.

### After

```
ObsidianVault/
├── Projects/
│   ├── 2025 AI Project.md
│   ├── team-sync.md
│   └── assets/
│       ├── diagram.png
│       └── meeting-notes.png
├── Notes/
│   ├── daily-log.md
│   └── assets/
│       └── screenshot.jpg
```

Now your images are organized into `assets/` directories for each note. This will allow you to share the notes too!

## How does it work

tbh i have no idea. But from what ChatGPT told me:

- It looks for `![[image.png]]` links in your `.md` files.
- Then tries to find those images in the root of your vault.
- If it finds one, it moves it into an `assets/` folder next to the markdown file.
- It does this for every `.md` file it can find — including subfolders.

## 🛠️ How to run

⚠️ **PLEASE make a backup before running this.** Just in case.

1. **Clone the repo:**

```bash
git clone https://github.com/CuzImAzizx/obsidian-image-organizer
cd obsidian-image-organizer/
```
2. **Run the script with your vault's path as an argument:**
```bash
node script.js "C:\Users\YourUsername\path\to\ObsidianVault"
```
_Alternatively, you can set the `basePath` variable in `script.js`:_

_Note: If no path is passed, the script uses `basePath`._
```js
const basePath = "/path/to/ObsidianVault/";`
```

3. **Check the log file** — all operations and errors are logged with timestamps in your vault under `.logs/obsidian-image-organizer-logs.log`. This can help if something breaks or goes missing.

## ⚙️ Command Line Options

Yes, I’ve actually added command-line options — mostly for my own convenience, but they might save your sanity too. Here's what you can pass when running the script:

- `--skip-vault-checking`: Skips the vault validation. Useful when you're running this on a server where the `.obsidian/` folder isn't synced.

- `--skip-not-found`: Suppresses logs like:"`Image not found in vault root: Pasted image 20250228090638.png`". Helpful after the first run, since moved images will obviously no longer be in the vault root.

- `--only-actions`: Limits logs to only show actual actions taken, like: "`Moved image...`", "`Created assets directory...`". Great for keeping your log files clean and focused on what matters.

### Pro Tip: Use It with `crontab`

I run this script every night at midnight on my server to auto-organize images. Here's my crontab line:

```bash
0 0 * * * node /path/to/obsidian-image-organizer/script.js "/path/to/ObsidianVault" --only-actions --skip-not-found --skip-vault-checking
```
Yep, I use all the options — that’s why I built them in the first place.

---

# 🗜️ Image Compression (Optional Utility)

If you want to reduce the size of your image files in the vault, I’ve also made a separate script: `compressor.js`.

This script goes through your vault and compresses all `.png` images using sharp. It saves a log in `./compressed-images.json` to avoid re-compressing the same files again.

## 🔧 How to Use
Install the dependencies (It's just `sharp` and `fs-extra`)

```bash
npm i # After cloning of course
``` 

Then just run the `compressor.js` with the vault's path as an argument

```bash
node compressor.js "C:\Users\YourUsername\path\to\ObsidianVault"
```
_Alternatively, you can set the `basePath` variable in `compressor.js`:_

_Note: If no path is passed, the script uses `basePath`._

## 🧠 What It Does
- Compresses all `.png` images in the vault (recursively).
- Skips already compressed images using `compressed-images.json`.
- Logs the original and new size for each image.

_Note: `compressor.js` does not log anyting in `.logs/obsidian-image-organizer-logs.log`. I am in the process to do so, infact, I will combine this compression functionality with the original script under a new name (Obsidian Image Manager), perhaps not today._


