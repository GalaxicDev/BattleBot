const mongoose = require('mongoose');

const geoGuessrQuestionSchema = new mongoose.Schema({
    image: String,
    correctAnswer: String,
    options: [String],
    isoCode: String,
    countryName: String
});

module.exports = mongoose.model('GeoGuessrQuestion', geoGuessrQuestionSchema);
