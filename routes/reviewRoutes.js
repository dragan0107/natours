const express = require("express");
const { addReview, getAllReviews } = require('../controllers/reviewController');
const { protect, restrictTo } = require('../controllers/authController');
const router = express.Router();


// router.route('/')
//     .post(protect, restrictTo('admin', 'user'), addReview)
//     .get(protect, getAllReviews);



module.exports = router;