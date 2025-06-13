const fs = require('fs');


if (!fs.existsSync("./compressed-images.json")
  || !fs.existsSync("./moved-images.json")
  || !fs.existsSync("./obsidian-image-organizer-logs.log")) {
  console.log("Please place me inside `.logs/` folder so I can read your logs and display useful information")
  process.exit(0);
}

//TODO: Validate the logs before proceeding
//TODO: Have a full analytic report for the logs

// Read the JSON file
fs.readFile('./compressed-images.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  try {
    const compressedImages = JSON.parse(data); // Parse JSON data

    let totalOldSize = 0;
    let totalNewSize = 0;

    compressedImages.forEach(image => {
      totalOldSize += image.oldSize;
      totalNewSize += image.newSize;
    });

    // Calculate size saved in MB
    const sizeSavedMB = (totalOldSize - totalNewSize) / (1024 * 1024);
    const oldSizeMB = totalOldSize / (1024 * 1024);
    const newSizeMB = totalNewSize / (1024 * 1024);

    // Calculate percentage saved
    const percentageSaved = ((totalOldSize - totalNewSize) / totalOldSize) * 100;

    console.log(`Total old size: ${oldSizeMB.toFixed(2)} MB`);
    console.log(`Total new size: ${newSizeMB.toFixed(2)} MB`);
    console.log(`Total size saved: ${sizeSavedMB.toFixed(2)} MB`);
    console.log(`Total percentage saved: ${percentageSaved.toFixed(2)}%`);

  } catch (parseErr) {
    console.error('Error parsing JSON:', parseErr);
  }
});