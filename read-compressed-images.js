const fs = require('fs');

// Read the JSON file
fs.readFile('compressed-images.json', 'utf8', (err, data) => {
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