const express = require("express");
const { getAllTours, addTour, getTour, updateTour, deleteTour, aliasTopTours, getTourStats, getMonthlyPlan } = require("../controllers/tourController");
const { protect, restrictTo } = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');
const router = express.Router();

// router.param("id", checkID);

router.use('/:tourId/reviews', reviewRouter); //attaching this review router to the tour router to this specific path

router.route("/top-5-cheap").get(aliasTopTours, getAllTours);

router.route("/tour-stats").get(getTourStats);

router.route("/monthly-plan/:year").get(getMonthlyPlan);

router.route("/")
    .get(protect, getAllTours)
    .post(addTour);

router.route("/:id")
    .get(getTour)
    .patch(updateTour)
    .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);



module.exports = router;