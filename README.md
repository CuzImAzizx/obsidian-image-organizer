
# 🖼️ Obsidian Image Organizer

This vibe-coded script will **organize** your Obsidian vault. Instead of having every pasted image dumped in the root directory, it will be moved into an `assets/` folder next to the note that references it.

It will also **compress** all PNG images (optional) to save space! Since they are all screenshots, why would you keep the full resolution?

---

## 📁 Example

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

---

## ⚙️ How it works

- It scans all `.md` files in your vault (recursively)
- Finds embedded image links like `![[image.png]]`
- Moves the actual image file (if found in the root) to a local `assets/` folder next to the note
- Creates logs of every operation in `.logs/`
- Optionally compresses `.png` images without affecting quality
- Skips already compressed or moved images using hashing

---

## 🛠️ Usage

```bash
node script.js [VAULT_PATH] [RUN_MODE] [OPTIONS]
```

### Parameters

| Argument | Description |
|----------|-------------|
| `VAULT_PATH` | Path to your Obsidian vault |
| `RUN_MODE` | One or more: `--move-images`, `--compress-images` |
| `OPTIONS` | Optional flags for more control |

---

## ⚙️ Command Line Options

### Run Modes _(Can be combined)_

- `--move-images` – Move embedded images to `assets/` next to each note
- `--compress-images` – Compress PNGs recursively (logs and skips already compressed ones)

### Optional Flags

- `--skip-vault-checking` – Skip the check for `.obsidian/` folder
- `--skip-not-found` – Ignore warnings about missing images
- `--only-actions` – Only log actual actions (cleaner logs)

---

## Example Commands

```bash
node script.js "/path/to/ObsidianVault" --move-images # To just organize the images
node script.js "/path/to/ObsidianVault" --compress-images # To just compress the .PNGs
node script.js "/path/to/ObsidianVault" --move-images --compress-images --only-actions --skip-not-found
```

---

## 🗃️ Logs

All actions and warnings are logged inside your vault:

```
ObsidianVault/.logs/
├── obsidian-image-organizer-logs.log
├── moved-images.json
└── compressed-images.json
```

- `obsidian-image-organizer-logs.log`: Human-readable log of everything done
- `moved-images.json`: All image move actions with timestamp
- `compressed-images.json`: All compression records with size change and hash

---

## ⚙️ Automation

You can run this script daily with `cron` to keep your vault clean:

```bash
0 0 * * * node /path/to/obsidian-image-organizer/script.js "/path/to/ObsidianVault" --move-images --compress-images --only-actions --skip-not-found --skip-vault-checking
```

