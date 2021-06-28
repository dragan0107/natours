const express = require("express");
const { addReview, getAllReviews } = require('../controllers/reviewController');
const { protect } = require('../controllers/authController');
const router = express.Router();


router.route('/')
    .post(protect, addReview)
    .get(protect, getAllReviews);



module.exports = router;