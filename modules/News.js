const { Schema, model } = require('mongoose');

const News = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    body: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    author: {
        type: String,
        required: true,
        trim: true
    }
});

module.exports = model('News', NewsSchema);
