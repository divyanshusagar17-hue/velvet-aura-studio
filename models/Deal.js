const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema({

    productName: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    // Old products ke liye ye field rakhi hai
    image: {
        type: String,
        required: true
    },

    // New products ke liye multiple images
    images: {
        type: [String],
        default: []
    },

    originalPrice: {
        type: Number,
        required: true
    },

    dealPrice: {
        type: Number,
        required: true
    },

    discount: {
        type: Number,
        required: true
    },

    store: {
        type: String,
        required: true
    },

    affiliateUrl: {
        type: String,
        required: true
    },

    category: {
        type: String,
        default: "Other"
    },

    // Multiple tags
    tags: {
        type: [String],
        default: []
    },

    amazonProductId: {
        type: String,
        default: ""
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Deal", dealSchema);