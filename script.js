const { error } = require("console");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const crypto = require("crypto");

// log the help menu
if(process.argv.length == 2){
    console.log(`Welcome to obsidian-image-organizer`);
    console.log(`https://github.com/CuzImAzizx/obsidian-image-organizer`);
    console.log(`Usage:\n\tnode script.js [VAULT_PATH] [RUN_MODE] [OPTIONS]`);
    console.log(`\nFor more information, visit the GitHub repo`);
    process.exit(0);
}


// == Global Variables ==
const vaultPath = process.argv[2];
let skipVaultChecking = false;
let skipNotFound = false;
let onlyActions = false;
let moveImagesToAssets = false;
let compressImages = false;
let printReport = false;

// == Functions ==

function setOptions(providedOptions) {
    providedOptions.forEach(arg => {
        if (arg.toLowerCase() == "--skip-vault-checking") {
            skipVaultChecking = true;
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
        } else if (arg.toLowerCase() == "--print-report"){
            printReport = true;
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
        console.log(`Usage:\n\tnode script.js [VAULT_PATH] [RUN_MODE] [OPTIONS]`);
        console.log(`\nFor more information, visit the GitHub repo: https://github.com/CuzImAzizx/obsidian-image-organizer`);
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
        const msg = "Error: The specified path is not a valid Obsidian vault. '.obsidian/' folder not found.\n\tCan Be skipped by adding the option --skip-vault-checking";
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
                const moveDate = new Date().toISOString();
                const data = {
                    //hash: hashFile(targetPath),
                    name: path.basename(targetPath),
                    previousLocation: imagePath,
                    newLocation: targetPath,
                    moveDate: moveDate
                }
                movedImages.push(data)
                fs.writeFileSync(movedJsonPath, JSON.stringify(movedImages, null, 2));
                log(`Moved image: ${imagePath} -> ${targetPath}`);
            } catch (e) {
                log(`Error moving ${imagePath}: ${e.message}`);
            }
        } else {
            let movedImages = JSON.parse(fs.readFileSync(movedJsonPath, 'utf-8'));
            let alreadyMoved = false;
            for (const image of movedImages) {
                if (image.name === imageName) {
                    alreadyMoved = true;
                    break;
                }
            }
            if (!alreadyMoved && !skipNotFound) {
                log(`Image not found in vault root: ${imageName}`);
            }
        }
    });
}


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

function generateCopyName(filePath) {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const name = path.basename(filePath, ext);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return path.join(dir, `${name}_copy_${timestamp}${ext}`);
}

async function startCompressImages() {
    const pngFiles = getAllPngFiles(vaultPath);
    const logPath = path.join(vaultPath, ".logs/");
    const compressedJsonPath = path.join(logPath, "compressed-images.json");

    // Read compressed-images.json and write only once, not every iteration. Compressed images will be re-compressed again IF the script is interrupted
    //TODO: Save progress every N images
    let compressedImagesList = JSON.parse(fs.readFileSync(compressedJsonPath));

    const compressedHashes = new Set(compressedImagesList.map(img => img.compressedImageHash));// Very cool

    for (const filePath of pngFiles) {
        const hash = hashFile(filePath);
        if (compressedHashes.has(hash)) {
            continue;
        }

        try {
            if (!onlyActions) log(`Compressing: ${filePath}`);

            // 1. Copy original
            const copyPath = generateCopyName(filePath);
            fs.copyFileSync(filePath, copyPath);

            // 2. Compress
            await sharp(copyPath)
                .png({ quality: 75, compressionLevel: 9 }) //TODO: Add options to control quality
                .toFile(filePath);

            const compressionDate = new Date().toISOString();
            const data = {
                imagePath: filePath,
                compressedImageHash: hashFile(filePath),
                oldSize: fs.statSync(copyPath).size,
                newSize: fs.statSync(filePath).size,
                compressionDate
            };

            // 3. Delete copy
            fs.unlinkSync(copyPath);

            // 4. Add to memory list
            compressedImagesList.push(data);
            compressedHashes.add(data.compressedImageHash);

            log(`Compressed: ${filePath}`);
        } catch (err) {
            console.error(`Error compressing ${filePath}:`, err);
        }
    }

    fs.writeFileSync(compressedJsonPath, JSON.stringify(compressedImagesList, null, 2));
    log(`Updated ${compressedJsonPath}`)
}

function formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        ++i;
    }
    return `${bytes.toFixed(2)} ${units[i]}`;
}

function formatDate(iso) {
    if (!iso || iso === "N/A") return "N/A";
    const date = new Date(iso);
    return date.toISOString().replace("T", " ").split(".")[0];
}

function getDurationMs(start, end) {
    return new Date(end).getTime() - new Date(start).getTime();
}

function generateReport(vaultPath) {
    const logPath = path.join(vaultPath, ".logs");

    const compressedPath = path.join(logPath, "compressed-images.json");
    const movedPath = path.join(logPath, "moved-images.json");
    const logFilePath = path.join(logPath, "obsidian-image-organizer-logs.log");

    const compressed = fs.existsSync(compressedPath)
        ? JSON.parse(fs.readFileSync(compressedPath, "utf-8"))
        : [];

    const moved = fs.existsSync(movedPath)
        ? JSON.parse(fs.readFileSync(movedPath, "utf-8"))
        : [];

    const logLines = fs.existsSync(logFilePath)
        ? fs.readFileSync(logFilePath, "utf-8").split("\n").filter(Boolean)
        : [];

    // Compressed Stats
    const totalCompressed = compressed.length;
    const totalOldSize = compressed.reduce((sum, img) => sum + img.oldSize, 0);
    const totalNewSize = compressed.reduce((sum, img) => sum + img.newSize, 0);
    const totalSaved = totalOldSize - totalNewSize;
    const percentSaved = (totalSaved / totalOldSize) * 100;

    const dates = compressed.map(img => new Date(img.compressionDate)).sort((a, b) => a - b);
    const firstCompression = dates[0]?.toISOString() ?? "N/A";
    const lastCompression = dates[dates.length - 1]?.toISOString() ?? "N/A";

    const biggestSave = compressed.reduce((max, img) => {
        const saved = img.oldSize - img.newSize;
        return saved > (max.oldSize - max.newSize) ? img : max;
    }, compressed[0] || { imagePath: "N/A", oldSize: 0, newSize: 0 });

    // Moved Stats
    const totalMoved = moved.length;
    const movedDates = moved.map(m => new Date(m.moveDate)).sort((a, b) => a - b);
    const firstMove = movedDates[0]?.toISOString() ?? "N/A";
    const lastMove = movedDates[movedDates.length - 1]?.toISOString() ?? "N/A";

    // Log Stats
    const startLines = logLines.filter(line => line.includes("Script Started"));
    const endLines = logLines.filter(line => line.includes("Script finished"));

    const runs = Math.min(startLines.length, endLines.length);
    const durations = [];
    let lastRunDuration = null;

    for (let i = 0; i < runs; i++) {
        const start = startLines[i].match(/\[(.*?)\]/)?.[1];
        const end = endLines[i].match(/\[(.*?)\]/)?.[1];
        if (start && end) {
            const duration = getDurationMs(start, end);
            durations.push(duration);
            if (i === runs - 1) lastRunDuration = duration;
        }
    }


    for (let i = 0; i < runs; i++) {
        const start = startLines[i].match(/\[(.*?)\]/)?.[1];
        const end = endLines[i].match(/\[(.*?)\]/)?.[1];
        if (start && end) {
            durations.push(getDurationMs(start, end));
        }
    }

    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / (durations.length || 1);
    const last3Runs = startLines.slice(-3).map(line => formatDate(line.match(/\[(.*?)\]/)?.[1]));

    // Final Report
    console.log("📊 Obsidian Image Organizer Report");
    console.log("----------------------------------");
    console.log(`🗜️  Compressed Images: ${totalCompressed}`);
    console.log(`📦  Original Size: ${formatBytes(totalOldSize)}`);
    console.log(`📉  Compressed Size: ${formatBytes(totalNewSize)}`);
    console.log(`💾  Space Saved: ${formatBytes(totalSaved)} (${percentSaved.toFixed(2)}%)`);
    console.log(`🕐  First Compression: ${formatDate(firstCompression)}`);
    console.log(`🕓  Last Compression:  ${formatDate(lastCompression)}`);
    console.log("\n📁 Moved Images: ", totalMoved);
    console.log(`🕐  First Move: ${formatDate(firstMove)}`);
    console.log(`🕓  Last Move:  ${formatDate(lastMove)}`);

    if (biggestSave?.imagePath && biggestSave.oldSize) {
        const savedBytes = biggestSave.oldSize - biggestSave.newSize;
        const percent = (savedBytes / biggestSave.oldSize) * 100;
        console.log("\n🏆  Biggest Save:");
        console.log(`    🔹 File: ${biggestSave.imagePath}`);
        console.log(`    📦 Old Size: ${formatBytes(biggestSave.oldSize)}`);
        console.log(`    📉 New Size: ${formatBytes(biggestSave.newSize)}`);
        console.log(`    💾 Saved: ${formatBytes(savedBytes)} (${percent.toFixed(2)}%)`);
    }

    console.log("\n📘 Script Runs: ", runs);
    if (lastRunDuration !== null) {
        console.log(`⏲️  Last Run Duration: ${(lastRunDuration / 1000).toFixed(2)} sec`);
    }
    console.log(`⏱️  Average Duration: ${(avgDuration / 1000).toFixed(2)} sec`);
    console.log(`🕓  Last 3 Runs: ${last3Runs.join(", ")}`);
}



// == Initial Check ==

validateLogs();
setOptions(process.argv);
validateVault();


// == Main Logic ==

async function main() {
    if (moveImagesToAssets) {
        const start = performance.now();
        log("Start moving images");
        const markdownFiles = findMarkdownFiles(vaultPath);
        log(`Found ${markdownFiles.length} markdown files.`);

        markdownFiles.forEach(mdFile => {
            if (!onlyActions) {
                log(`Processing markdown file: ${mdFile}`);
            }
            moveImagesForMarkdownFile(mdFile, vaultPath);
        });
        const end = performance.now();
        const elapsed = Math.round(end - start);
        log(`Finished moving images. Elapsed time: ${elapsed} ms`) //TODO: Make it so it display seconds or minuts, not only ms
    }

    if (compressImages) {
        const start = performance.now();
        log("Start compressing images");
        await startCompressImages();
        const end = performance.now();
        const elapsed = Math.round(end - start);
        log(`Finished compressing images Elapsed time: ${elapsed} ms`); //TODO: Same thing above ^^
    }

    if(printReport){
        //This whole functionality is made by ChatGPT. I hope it doesn't break anything
        generateReport(vaultPath)
    }

    log("===== Script finished =====");

}

main()

