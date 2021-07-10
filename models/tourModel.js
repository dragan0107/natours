const mongoose = require('mongoose');
const { default: slugify } = require('slugify');
const validator = require("validator");
// const User = require('./userModel');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required to input"],
        unique: true,
        trim: true,
        minlength: [10, "Input name must be at least 10 but no more than 40 characters!"],
        maxlength: [40, "Input name cannot be longer than 40 characters!"]
            // validate: [validator.isAlpha, "Name must be a letter from A-Z my friend"]
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, "A tour must have a duration"]
    },
    maxGroupSize: {
        type: Number,
        required: [true, "A tour must have a group size."]
    },
    difficulty: {
        type: String,
        required: [true, "A tour must have a difficulty."]
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, "Rating must be equal or above 1"],
        max: [5, "Rating must be equal or below 5"]
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, "Price is required to input"]
    },
    secretTour: {
        type: Boolean,
        default: false
    },
    priceDiscount: Number,
    summary: {
        type: String,
        trim: true,
        required: [true, "A tour must have a description."]
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, "A tour must have an image."]
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now()
    },
    startDates: [Date],
    startLocation: {
        //GeoJSON - this obj needs to have at least TYPE and COORD fields
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number], //longitude first, latitude second
        address: String,
        description: String
    },
    locations: [{
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
    }],
    // We reference users by their ID directly from the User document, it also saves us trouble in case some user info gets changed.
    guides: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }]
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


//Virtual property that is only displaying when we request data from the DB

tourSchema.virtual("durationInWeeks").get(function() {
    return this.duration / 7
});



// Virtual property of reviews that will refer to Review model, and connect to it through foreign field 'tour' where the ID of the tour is stored, and local ID of the tour.
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

//pre and post save doc middlewares

// tourSchema.pre("save", function(next) {
//     this.slug = slugify(this.name, { lower: true });
//     next();
// });

// tourSchema.post("save", function(doc, next) {

//     next();
// });

//Pre and post FIND middlewares

tourSchema.pre(/^find/, function(next) {

    //this middleware populates the 'guides' property with any 'find' query, and excludes __v and passwordChangedAt info
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });

    next();
});


tourSchema.pre(/^find/, function(next) {
    // this.find({ secretTour: true })
    this.start = Date.now();
    next();
});



//pre db save middleware that takes the IDs from body, queries for a match in DB and returns the promise to 'guidesPromises' array

// tourSchema.pre('save', async function(next) {

//     const guidesPromises = this.guides.map(async id =>
//         await User.findById({ _id: id })
//     );
//     //resolving all promises at once and saving it to the array
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });

tourSchema.post(/^find/, function(docs, next) {
    console.log(`This query took ${Date.now() - this.start} milliseconds`);
    next();
});


//AGGREGATION middlewares


tourSchema.pre("aggregate", function(next) {
    this.pipeline().unshift({
        $match: { secretTour: { $ne: true } }
    });
    next();
});

tourSchema.post("aggregate", function(doc, next) {
    // console.log(this);
    next();
});



const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;