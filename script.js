const fs = require("fs");
const path = require("path");

// === CONFIGURATION ===
// Set this to the root directory where the Obsidian vault or a subfolder resides

const cmdPath = process.argv[2];
const basePath = "C:\\Users\\YourUsername\\path\\to\\ObsidianVault\\";
// Note: In Windows, each backslash should be escaped (\\) or use forward slashes (/) instead
const vaultPath = cmdPath ? cmdPath : basePath;


// === HELPER FUNCTIONS ===

function checkValidVaultPath(vaultPath){
  // Check if path did provided
  if(vaultPath == "C:\\Users\\YourUsername\\path\\to\\ObsidianVault\\"){
    console.error("Error: No path was provided. Please provide a valid path as an argument");
    process.exit(1)
  }

  // Check if path exists
  if (!fs.existsSync(vaultPath)) {
    console.error("Error: The specified path does not exist.");
    process.exit(1);
  }

  // Check if it's an actual Obsidian vault
  const obsidianFolder = path.join(vaultPath, '.obsidian');
  if (!fs.existsSync(obsidianFolder)) {
    console.error("Error: The specified path is not a valid Obsidian vault. '.obsidian' folder not found.");
    process.exit(1);
  }
}

// Recursively find all `.md` files in the given directory
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

// Extract image names (e.g., ![[image.png]]) from markdown content
function extractImagesFromMarkdown(content) {
  const imageRegex = /!\[\[([^\]]+)\]\]/g;
  const images = [];
  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    images.push(match[1]);
  }
  return images;
}

// Move images to the local assets folder next to the markdown file
function moveImagesForMarkdownFile(mdFilePath, vaultRoot) {
  const mdContent = fs.readFileSync(mdFilePath, "utf-8");
  const imagesInMdFile = extractImagesFromMarkdown(mdContent);
  if (imagesInMdFile.length === 0) return;

  const assetsDir = path.join(path.dirname(mdFilePath), "assets");
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
  }

  imagesInMdFile.forEach(imageName => {
    const imagePath = path.join(vaultRoot, imageName);
    if (fs.existsSync(imagePath)) {
      const targetPath = path.join(assetsDir, path.basename(imageName));
      try {
        fs.renameSync(imagePath, targetPath);
        console.log(`Moved ${imageName} -> ${targetPath}`);
      } catch (e) {
        console.log(`Error moving ${imagePath}: ${e}`);
      }
    } else {
      console.log(`Image not found: ${imageName}`);
    }
  });
}

// === MAIN LOGIC ===

checkValidVaultPath(vaultPath);
const markdownFiles = findMarkdownFiles(vaultPath);
console.log(`Found ${markdownFiles.length} markdown files.`);

markdownFiles.forEach(mdFile => {
  console.log(`Processing ${mdFile}...`);
  moveImagesForMarkdownFile(mdFile, vaultPath);
});
