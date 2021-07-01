const Review = require('../models/reviewModel');
const catchAsync = require('../utilities/catchAsync');

//review adding function
exports.addReview = catchAsync(async(req, res, next) => {

    const rev = await Review.create(req.body);

    //status 201 means CREATED
    res.status(201).json({
        data: {
            rev
        }
    });
});

exports.getAllReviews = catchAsync(async(req, res, next) => {

    const revs = await Review.find({});

    res.status(200).json({
        results: revs.length,
        data: {
            revs
        }
    });
});