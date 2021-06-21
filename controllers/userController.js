const catchAsync = require("../utilities/catchAsync");
const User = require('../models/userModel');
const AppError = require("../utilities/appError");


exports.getUsers = catchAsync(async(req, res, next) => {


    const users = await User.find();

    res.status(200).json({
        numberOfUsers: users.length,
        status: "success",
        users: users
    });
});

const filterObj = (obj, ...allowedFields) => {
    const newObj = {}
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) {
            newObj[el] = obj[el];
        }
    });

    return newObj;
}


exports.updateMe = catchAsync(async(req, res, next) => {
    // 1) If user enters password, we should return an error

    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError("You can't change password on this route. Go to /updatePassword"))
    }

    const filteredBody = filterObj(req.body, 'name', 'email');

    const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });


    res.status(200).json({
        status: "success",
        updatedUser: user
    });



});

exports.deleteMe = catchAsync(async(req, res, next) => {

    await User.findByIdAndUpdate(req.user.id, { active: false })

    res.status(204).json({
        status: 'success'
    });
});

exports.addUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "This has not yet been implemented.."
    });
}

exports.getUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "This has not yet been implemented.."
    });
}
exports.updateUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "This has not yet been implemented.."
    });
}
exports.deleteUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "This has not yet been implemented.."
    });
}