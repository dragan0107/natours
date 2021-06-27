const mongoose = require('mongoose');


const reviewSchema = new mongoose.Schema({
    review: {
        type: String
    },
    rating: {
        type: Number,
        min: [1, 'Rating must be between 1 and 5'],
        max: [5, 'Rating must be between 1 and 5']
    },
    createdAt: {
        type: Date
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour'
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }
});

reviewSchema.pre(/^find/, function(next) {

    this.populate({
        path: 'tour',
        select: 'name rating'
    }).populate('user');

    next();
})

const Review = mongoose.model('Review', reviewSchema);



module.exports = Review;