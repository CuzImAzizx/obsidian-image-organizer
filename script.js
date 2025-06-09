const fs = require("fs");
const path = require("path");

// === CONFIGURATION ===
const cmdPath = process.argv[2]; // It's not always passed as first argument, gotta fix it later.
const basePath = "C:\\Users\\YourUsername\\path\\to\\ObsidianVault\\";
const vaultPath = cmdPath ? cmdPath : basePath;

const logDir = path.join(vaultPath, ".logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFilePath = path.join(logDir, "obsidian-image-organizer-logs.log");
// === LOGGER ===
function log(message) {
  const timestamp = new Date().toISOString();
  const fullMessage = `[${timestamp}] ${message}\n`;

  // Ensure the log file exists or create it
  try {
    if (!fs.existsSync(logFilePath)) {
      fs.writeFileSync(logFilePath, "", "utf-8");
    }
    fs.appendFileSync(logFilePath, fullMessage, "utf-8");
  } catch (err) {
    console.error("Failed to write to log file:", err);
  }

  console.log(fullMessage.trim()); // Also log to console
}

// === HELPER FUNCTIONS ===

function checkValidVaultPath(vaultPath) {
  let skipVaultChecking = false;
  process.argv.forEach(arg => {
    if (arg === '--skip-vault-checking') {
      skipVaultChecking = true;
      log(`Skipping vault checking`);
    }
  });
  if (skipVaultChecking) {
    return;
  }

  if (vaultPath === "C:\\Users\\YourUsername\\path\\to\\ObsidianVault\\") {
    const msg = "Error: No path was provided. Please provide a valid path as an argument.";
    log(msg);
    log("===== Script exited 1 =====");
    process.exit(1);
  }

  if (!fs.existsSync(vaultPath)) {
    const msg = "Error: The specified path does not exist.";
    log(msg);
    log("===== Script exited 1 =====");
    process.exit(1);
  }

  const obsidianFolder = path.join(vaultPath, ".obsidian");
  if (!fs.existsSync(obsidianFolder)) {
    const msg = "Error: The specified path is not a valid Obsidian vault. '.obsidian' folder not found.";
    log(msg);
    log("===== Script exited 1 =====");
    process.exit(1);
  }

  log(`Vault path validated: ${vaultPath}`);
}

function findMarkdownFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findMarkdownFiles(fullPath));
    } else if (file.endsWith(".md")) {
      results.push(fullPath);
    }
  });

  return results;
}

function extractImagesFromMarkdown(content) {
  const imageRegex = /!\[\[([^\]]+)\]\]/g;
  const images = [];
  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    images.push(match[1]);
  }
  return images;
}

function moveImagesForMarkdownFile(mdFilePath, vaultRoot) {
  const mdContent = fs.readFileSync(mdFilePath, "utf-8");
  const imagesInMdFile = extractImagesFromMarkdown(mdContent);
  if (imagesInMdFile.length === 0) return;

  const assetsDir = path.join(path.dirname(mdFilePath), "assets");
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
    log(`Created assets directory: ${assetsDir}`);
  }

  imagesInMdFile.forEach(imageName => {
    const imagePath = path.join(vaultRoot, imageName);
    if (fs.existsSync(imagePath)) {
      const targetPath = path.join(assetsDir, path.basename(imageName));
      try {
        fs.renameSync(imagePath, targetPath);
        log(`Moved image: ${imagePath} -> ${targetPath}`);
      } catch (e) {
        log(`Error moving ${imagePath}: ${e.message}`);
      }
    } else {
      log(`Image not found in vault root: ${imageName}`);
    }
  });
}

// === MAIN LOGIC ===

log("===== Script started =====");

checkValidVaultPath(vaultPath);

const markdownFiles = findMarkdownFiles(vaultPath);
log(`Found ${markdownFiles.length} markdown files.`);

markdownFiles.forEach(mdFile => {
  log(`Processing markdown file: ${mdFile}`);
  moveImagesForMarkdownFile(mdFile, vaultPath);
});

log("===== Script completed =====");
