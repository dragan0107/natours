const Tour = require("../models/tourModel");
const APIFeatures = require("../utilities/apiFeatures");
const catchAsync = require("../utilities/catchAsync");
const AppError = require("../utilities/appError");

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = "5";
    req.query.sort = "price,ratingsAverage";
    req.query.fields = "name,price,ratingsAverage,summary,difficulty"
    next();
};

exports.getAllTours = catchAsync(async(req, res, next) => {

    const features = new APIFeatures(Tour, req.query)
        .filter()
        .sort()
        .fields()
        .paginate();
    console.log(features.query);

    // const allTours = await Tour.find().find({ price: { $gt: 1000 } });
    const allTours = await features.query;

    // let total = 0;

    // for (i = 0; i < allTours.length; i++) {
    //     total = total + allTours[i].price;
    // }
    // let avg = total / allTours.length;
    // console.log(avg);

    res.status(200).json({
        status: "success",
        tourNumber: allTours.length,
        data: {
            tours: allTours
        }
    });

});



exports.getTour = catchAsync(async(req, res, next) => {

    const tour = await Tour.findById(req.params.id).populate('reviews'); //we've added the .populate method to fill up the specific tour with the reviews including info of user who posted.

    if (!tour) {
        return next(new AppError("No tour found with that ID", 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            tour: tour
        }
    });
});

exports.addTour = catchAsync(async(req, res, next) => {

    const newTour = await Tour.create(req.body);

    res.status(201).json({
        status: "success",
        data: {
            tour: newTour
        }

    });
});


exports.updateTour = catchAsync(async(req, res, next) => {
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    if (!updatedTour) {
        return next(new AppError("No tour found with that ID", 404));
    }

    res.status(201).json({
        status: "success",
        data: {
            updatedTour
        }

    });
});


exports.deleteTour = catchAsync(async(req, res, next) => {

    const deletedTour = await Tour.findByIdAndDelete(req.params.id);

    if (!deletedTour) {
        return next(new AppError("No tour found with that ID", 404));
    }

    res.status(204).json({
        status: "success"

    });
});


exports.getTourStats = catchAsync(async(req, res, next) => {
    const stats = await Tour.aggregate([{
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: { $toUpper: "$difficulty" },
                numTours: { $sum: 1 },
                numRatings: { $sum: "$ratingsQuantity" },
                avgRating: { $avg: "$ratingsAverage" },
                avgPrice: { $avg: "$price" },
                minPrice: { $min: "$price" },
                maxPrice: { $max: "$price" }

            }
        },
        {
            $sort: { avgPrice: -1 }
        }
        // {
        //     $match: { _id: { $ne: "medium" } }
        // }
    ]);
    res.status(200).json({
        status: "success",
        data: {
            stats
        }

    });
});

exports.getMonthlyPlan = catchAsync(async(req, res, next) => {

    const year = req.params.year * 1;
    const months = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const plan = await Tour.aggregate([{
            $unwind: "$startDates"
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: "$startDates" },
                toursAmt: { $sum: 1 },
                tours: { $push: "$name" }
            }
        },
        {
            $sort: { toursAmt: -1 }
        },
        {
            $addFields: { month: "$_id" }
        },
        {
            $project: { _id: 0 }
        },
        // {
        //     $limit: 6
        // }
    ]);
    plan.map(el => {
        el.month = months[el.month - 1]
    })
    res.status(201).json({
        status: "success",
        data: {
            plan
        }


    });
});