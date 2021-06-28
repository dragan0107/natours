const Review = require('../models/reviewModel');

exports.addReview = async(req, res, next) => {

    const rev = await Review.create(req.body);


    res.status(200).json({
        data: rev
    });
}

exports.getAllReviews = async(req, res, next) => {

    const revs = await Review.find({});

    res.status(200).json({
        data: revs
    });
}