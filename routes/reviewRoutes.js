const express = require("express");
const { addReview, getReviews } = require('../controllers/reviewController');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); //mergeParams allows us to access the parameters OUTSIDE of this local router to everything before it. 


router.route('/')
    .get(protect, getReviews)
    .post(protect, restrictTo('admin', 'user'), addReview);




module.exports = router;