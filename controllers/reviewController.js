const Review = require('../models/reviewModel');
const catchAsync = require('../utilities/catchAsync');

//review adding function
exports.addReview = catchAsync(async(req, res, next) => {

    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;

    const rev = await Review.create(req.body);

    //status 201 means CREATED
    res.status(201).json({
        data: {
            rev
        }
    });
});

exports.getReviews = catchAsync(async(req, res, next) => {

    const tourID = req.params.tourId;

    const revs = await Review.find({ tour: tourID });

    res.status(200).json({
        results: revs.length,
        data: {
            revs
        }
    });
});