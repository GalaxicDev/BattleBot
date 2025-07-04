const fs = require('fs-extra');
const path = require('path');
const { createCanvas } = require('canvas');
const geojson = require('./custom.geo.json');

const width = 400;
const height = 400;
const outputDir = './outlines';

(async () => {
    // Dynamically import d3-geo (ESM)
    const { geoPath, geoMercator } = await import('d3-geo');

    await fs.ensureDir(outputDir);

    for (const feature of geojson.features) {
        const name = feature.properties.name || feature.properties.ADMIN || 'unknown';
        const filename = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
        const canvas = createCanvas(width, height);
        const context = canvas.getContext('2d');

        const projection = geoMercator()
            .fitSize([width - 20, height - 20], feature);

        const pathGenerator = geoPath(projection, context);

        // Draw outline
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.beginPath();
        pathGenerator(feature);
        context.stroke();

        const outPath = path.join(outputDir, filename);
        const buffer = canvas.toBuffer('image/png');
        await fs.writeFile(outPath, buffer);

        console.log(`Saved ${filename}`);
    }
})();