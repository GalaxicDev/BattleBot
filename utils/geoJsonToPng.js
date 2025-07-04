require('dotenv').config();

const fs = require('fs-extra');
const path = require('path');
const mongoose = require('mongoose');
const { createCanvas } = require('canvas');
const geojson = require('./custom.geo.json');
const GeoGuessrQuestion = require('../models//geoGuessrModel');

const width = 400;
const height = 400;
const outputDir = './outlines';

(async () => {
    const { geoPath, geoMercator } = await import('d3-geo');
    await fs.ensureDir(outputDir);

    mongoose.connect(process.env.MONGO_URI).then(() => {
        console.log('Connected to MongoDB!');
    }).catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit if connection fails
    });

    function getCountryName(props) {
        return (
            props.name_long ||
            props.name ||
            props.ADMIN ||
            props.geounit ||
            props.sovereignt ||
            props.ISO_A3 ||
            'unknown'
        );
    }

    function getSmartDistractors(feature, allFeatures, correctName, count = 3) {
        const region = feature.properties.subregion || feature.properties.region;
        // Find countries in the same region/subregion, excluding the correct one
        let candidates = allFeatures.filter(f => {
            const fRegion = f.properties.subregion || f.properties.region;
            const fName = getCountryName(f.properties).trim();
            return fRegion === region && fName !== correctName;
        });

        // If not enough, fill with random others
        if (candidates.length < count) {
            const others = allFeatures.filter(f => getCountryName(f.properties).trim() !== correctName && !candidates.includes(f));
            candidates = candidates.concat(
                others.sort(() => 0.5 - Math.random()).slice(0, count - candidates.length)
            );
        }

        // Shuffle and pick the required number
        return candidates
            .sort(() => 0.5 - Math.random())
            .slice(0, count)
            .map(f => getCountryName(f.properties).trim());
    }

    for (const feature of geojson.features) {
        const name = getCountryName(feature.properties).trim();
        const isoCode = feature.properties.ISO_A3 || 'UNK';
        const safeFileName = name
            .toLowerCase()
            .replace(/[^a-z0-9]/gi, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '')
            .substring(0, 40);

        const filename = `${safeFileName}.png`;
        const canvas = createCanvas(width, height);
        const context = canvas.getContext('2d');

        const projection = geoMercator().fitSize([width - 20, height - 20], feature);
        const pathGenerator = geoPath(projection, context);

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

        const distractors = getSmartDistractors(feature, geojson.features, name, 3);
        console.log(`Distractors for ${name}:`, distractors);
        const options = [...distractors, name].sort(() => 0.5 - Math.random());

        // Save to MongoDB
        await GeoGuessrQuestion.create({
            image: filename,
            correctAnswer: name,
            options, // you can populate these later randomly
            isoCode,
            countryName: name,
        });
    }

    await mongoose.disconnect();
})();
