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
- It does this for every `.md` file it can find - including subfolders.

## How to run

⚠️ **PLEASE make a backup before running this.** Just in case.

You will be needing NodeJS to run this script.

1. Clone or download this repo.
2. Open the script and set the `basePath` variable to your vault directory.
3. Run it using:
```
node script.js
```
4. Save the output — it might help if something breaks or goes missing.