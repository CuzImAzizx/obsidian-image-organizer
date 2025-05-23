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

## 🛠️ How to run

⚠️ **PLEASE make a backup before running this.** Just in case.

1. **Clone the repo:**

- `git clone https://github.com/your-username/your-repo-name.git`

- `cd your-repo-name`

2. **Set the vault path:**

- Option 1: Edit the `basePath` variable in `script.js`.

- `const basePath = "your new path";`

- Option 2: Pass the path as a command-line argument:

  ```
  node script.js "C:\Users\YourUsername\path\to\ObsidianVault"
  ```

- Note: if no path is passed, the script uses a default path.

3. **Run the script:**

4. **Save the output** — it might help if something breaks or goes missing.
