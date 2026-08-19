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

    image: {
        type: String,
        required: true
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

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Deal", dealSchema);