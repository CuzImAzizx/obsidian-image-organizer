const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const sharp = require("sharp");

const cmdPath = process.argv[2]; // It's not always passed as first argument, gotta fix it later.
const basePath = "C:\\Users\\YourUsername\\path\\to\\ObsidianVault\\";
const imagesDir = cmdPath ? cmdPath : basePath;

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
    console.error(msg)
    process.exit(1);
  }

  if (!fs.existsSync(vaultPath)) {
    const msg = "Error: The specified path does not exist.";
    console.error(msg)
    process.exit(1);
  }

  const obsidianFolder = path.join(vaultPath, ".obsidian");
  if (!fs.existsSync(obsidianFolder)) {
    const msg = "Error: The specified path is not a valid Obsidian vault. '.obsidian' folder not found.";
    console.error(msg)
    process.exit(1);
  }

  log(`Vault path validated: ${vaultPath}`);
}

checkValidVaultPath(imagesDir)

const compressedJsonPath = path.join(imagesDir, ".logs/compressed-images.json");

let myDate = new Date()
myDate.toISOString()

// Load or create the JSON file that tracks compressed images
let compressedImages = [];
if (fs.existsSync(compressedJsonPath)) {
  compressedImages = JSON.parse(fs.readFileSync(compressedJsonPath));
} else {
  fs.writeFileSync(compressedJsonPath, JSON.stringify([], null, 2));
}

// Helper: Get all PNG files recursively
function getAllPngFiles(dir) {
  let files = [];

  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(getAllPngFiles(fullPath));
    } else if (item.isFile() && path.extname(item.name).toLowerCase() === ".png") {
      files.push(fullPath);
    }
  }

  return files;
}

// Helper: Generate timestamped copy name
function generateCopyName(filePath) {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const name = path.basename(filePath, ext);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(dir, `${name}_copy_${timestamp}${ext}`);
}

(async () => {
  const pngFiles = getAllPngFiles(imagesDir);

  for (const filePath of pngFiles) {
    if (compressedImages.some(image => image.imagePath === filePath)) {
      console.log(`Skipping already compressed: ${filePath}`);
      continue;
    }

    try {
      console.log(`🔄 Processing: ${filePath}`);

      // 1. Copy the original image
      const copyPath = generateCopyName(filePath);
      await fse.copy(filePath, copyPath);

      // 2. Compress and overwrite original
      await sharp(copyPath)
        .png({ quality: 75, compressionLevel: 9 })
        .toFile(filePath);

      const compressionDate = new Date().toISOString();

      // 3. Get information
      const data = {
        imagePath: filePath,
        oldSize: fs.statSync(copyPath).size,
        newSize: fs.statSync(filePath).size,
        compressionDate: compressionDate
      };
      
      // 4. Delete the copy
      fs.rmSync(copyPath)

      // 5. Update the compressed list
      compressedImages.push(data);
      fs.writeFileSync(compressedJsonPath, JSON.stringify(compressedImages, null, 2));

      console.log(`✅ Compressed and updated: ${filePath}`);
    } catch (err) {
      console.error(`❌ Error processing ${filePath}:`, err);
    }
  }
})();
