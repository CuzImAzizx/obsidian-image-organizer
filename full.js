const { error } = require("console");
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const sharp = require("sharp");
const crypto = require("crypto");


// == Global Variables ==
const vaultPath = process.argv[2];
let skipVaultChecking = false;
let skipNotFound = false;
let onlyActions = false;
let moveImagesToAssets = false;
let compressImages = false;

// == Functions ==

function setOptions(providedOptions) {
    providedOptions.forEach(arg => {
        if (arg.toLowerCase() == "--skip-vault-checking") {
            skipVaultChecking = true
            log("Skipping vault checking");
        } else if (arg.toLowerCase() == "--skip-not-found") {
            skipNotFound = true;
            log("Ignoring not found images");
        } else if (arg.toLowerCase() == "--only-actions") {
            onlyActions = true;
            log("Logging only actions");
        } else if (arg.toLowerCase() == "--move-images") {
            moveImagesToAssets = true;
        } else if (arg.toLowerCase() == "--compress-images") {
            compressImages = true;
        } else if (arg.startsWith("--")) {
            //wtf, it's an option provided but it's something else?
            log(`Error: Option "${arg}" unknown`);
            log("===== Script exited 1 =====");
            process.exit(1);
        }
    })
}

function validateLogs() {
    // Ensure the log files exists or create it
    if (!fs.existsSync(vaultPath)) {
        console.error("Invalid vaultPath, does not exists.");
        process.exit(1);
    }

    // Create the `.logs/` folder if not exists
    const logPath = path.join(vaultPath, ".logs/");
    try {
        if (!fs.existsSync(logPath)) {
            fs.mkdirSync(logPath);
        }
    } catch (err) {
        console.error("Failed to create `.logs/` folder:", err);
        process.exit(1);
    }

    // Create logs file if not exists
    const logFilePath = path.join(logPath, "obsidian-image-organizer-logs.log");
    const compressedJsonPath = path.join(logPath, "compressed-images.json");
    const movedJsonPath = path.join(logPath, "moved-images.json");
    try {
        if (!fs.existsSync(logFilePath)) {
            fs.writeFileSync(logFilePath, "", "utf-8");
            console.log(`Created ${logFilePath}`);
        }
        if (!fs.existsSync(compressedJsonPath)) {
            fs.writeFileSync(compressedJsonPath, JSON.stringify([], null, 2));
            console.log(`Created ${compressedJsonPath}`);
        }
        if (!fs.existsSync(movedJsonPath)) {
            fs.writeFileSync(movedJsonPath, JSON.stringify([], null, 2));
            console.log(`Created ${movedJsonPath}`);
        }
    } catch (err) {
        console.error("Failed to write to log files:", err);
        process.exit(1);
    }

    try {
        const compressedJsonData = JSON.parse(fs.readFileSync(compressedJsonPath, 'utf-8'));
        if (!Array.isArray(compressedJsonData)) {
            throw error();
        }
        const movedJsonData = JSON.parse(fs.readFileSync(movedJsonPath, 'utf-8'));
        if (!Array.isArray(movedJsonData)) {
            throw error();
        }
    } catch (err) {
        console.error(`Error: "${compressedJsonPath}" or "${movedJsonPath}" is not a valid JSON array`);
        process.exit(1);
    }

    //Now it's safe to use log().
    //TODO: get logs stats e.g. how many lines in logFilePath, how many images in compressedJsonPath.
    log("===== Script Started =====");
    log("Log files has been validated");
}




function validateVault() {
    if (skipVaultChecking) {
        return;
    }
    if (!vaultPath || vaultPath == "" || vaultPath.startsWith("--")) {
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
        const msg = "Error: The specified path is not a valid Obsidian vault. '.obsidian/' folder not found.";
        log(msg);
        log("===== Script exited 1 =====");
        process.exit(1);
    }

    log(`Vault path validated: ${vaultPath}`);
}


function log(message) {
    const timestamp = new Date().toISOString();
    const fullMessage = `[${timestamp}] ${message}\n`;

    const logFilePath = path.join(path.join(vaultPath, ".logs/"), "obsidian-image-organizer-logs.log");

    try {
        fs.appendFileSync(logFilePath, fullMessage, "utf-8");
    } catch (err) {
        console.error("Failed to write to log file:", err);
    }
    console.log(fullMessage.trim()); // Also log to console
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

function hashFile(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
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

    const logPath = path.join(vaultPath, ".logs/");
    const movedJsonPath = path.join(logPath, "moved-images.json");

    imagesInMdFile.forEach(imageName => {
        const imagePath = path.join(vaultRoot, imageName);
        if (fs.existsSync(imagePath)) {
            const targetPath = path.join(assetsDir, path.basename(imageName));
            try {
                fs.renameSync(imagePath, targetPath);
                // Log the movement
                let movedImages = JSON.parse(fs.readFileSync(movedJsonPath, 'utf-8'));
                const data = {
                    imageHash: hashFile(targetPath),
                    imageName: path.basename(targetPath),
                    previousLocation: imagePath,
                    newLocation: targetPath
                }
                movedImages.push(data)
                fs.writeFileSync(movedJsonPath, JSON.stringify(movedImages, null, 2));
                log(`Moved image: ${imagePath} -> ${targetPath}`);
            } catch (e) {
                log(`Error moving ${imagePath}: ${e.message}`);
            }
        } else {
            // TODO: Check if the image has been moved already (using moved-images.json)
            if (!skipNotFound) {
                log(`Image not found in vault root: ${imageName}`);
            }
        }
    });
}




// == Initial Check ==

validateLogs();
setOptions(process.argv);
validateVault();


// == Main Logic ==

if (moveImagesToAssets) {
    log("Start moving images to assets")
    const markdownFiles = findMarkdownFiles(vaultPath);
    log(`Found ${markdownFiles.length} markdown files.`);

    markdownFiles.forEach(mdFile => {
        if (!onlyActions) {
            log(`Processing markdown file: ${mdFile}`);
        }
        moveImagesForMarkdownFile(mdFile, vaultPath);
    });
}

if (compressImages) {
    log("Start compressing images")
}







log("===== Script finished =====");




// Later, additional features
// Load the compressed images json
const logPath = path.join(vaultPath, ".logs/");
const compressedJsonPath = path.join(logPath, "compressed-images.json");
//let compressedImagesList = JSON.parse(fs.readFileSync(compressedJsonPath));

