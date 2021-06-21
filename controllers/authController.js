const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utilities/catchAsync');
const AppError = require("../utilities/appError");
const sendEmail = require('../utilities/email');
const crypto = require('crypto');


const genToken = id => {

    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRATION
    });
}

//Function that accepts a user, creates a token and then sends a cookie
const createSendToken = (user, statusCode, res) => {

    const token = genToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRATION * 24 * 60 * 60 * 1000)),
        httpOnly: true
    };

    if (process.env.NODE_ENV !== "development") cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    //remove the password field before sending the response to the client
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        user: user
    });

}


//user signup function
exports.signup = catchAsync(async(req, res, next) => {

    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    });

    createSendToken(newUser, 201, res);

});


//user login function
exports.login = catchAsync(async(req, res, next) => {

    const { email, password } = req.body;

    //check if email and password have been input
    if (!email || !password) {
        return next(new AppError('Please enter both password and email!', 400));
    }

    const user = await User.findOne({ email: email }).select('+password'); //re-including password field for comparison since in schema we defined select as false

    if (!user || !await user.correctPassword(password, user.password)) {
        return next(new AppError('User email or password are incorrect..', 400));
    }

    //if all is ok, send a token back, since it reached this line, its successful

    createSendToken(user, 200, res);

});



//protect middleware for certain routes
exports.protect = catchAsync(async(req, res, next) => {

    let token;
    // 1) Getting a token and checking if it's there
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in, please try again.', 401));
    }

    // 2) Token verification
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);


    //3) Checking if the user with the provided token still exists in the DB

    const userFound = await User.findById(decoded.id);

    if (!userFound) {
        return next(new AppError('User with the provided token no longer exists, register again', 401));
    }

    // 4) Checking if password has been changed after the token has been issued.

    if (userFound.changedPassword(decoded.iat)) {
        return next(new AppError('Password has been changed recently, please login with new password!', 401));
    }

    req.user = userFound;
    //Finally if it makes it to this point, access to the tours will be granted.
    next();
});

exports.restrictTo = (...roles) => {

    return (req, res, next) => {

        console.log(req.user);
        if (!roles.includes(req.user.role)) {
            return next(new AppError(`The user doesn't have permission to access this route`, 403));
        }

        next();
    }

};

exports.forgotPassword = catchAsync(async(req, res, next) => {
    // 1) Get user based on requested email;
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new AppError(`Wrong email or user doesn't exist`, 404));
    }

    // 2) generate token if the user exists and save it to the document;

    const resetToken = user.createPasswordResetToken();

    await user.save({ validateBeforeSave: false });

    // 3) Send user an email with the reset link and token;

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/${resetToken}`;

    const message = `Submit a patch request with new password and confirmed password to this url: ${resetURL}.Token is valid for 10 minutes, so until ${user.passwordResetExpires}`


    try {
        await sendEmail({
            email: user.email,
            subject: 'Password reset token',
            message
        });

        res.status(200).json({
            status: 'success',
            message: 'token sent to email'
        });

    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending the email. Try later.', 500));

    }
});

exports.resetPassword = catchAsync(async(req, res, next) => {

    //1 Encrypt the token from request and query into the database for a user. 
    //Simultaneously we're checking if the token is still running or expired.
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

    // 2) If there is no user, error and next.

    if (!user) {
        return next(new AppError('User does not exist or expired token', 400));
    }

    // 3) Now actually set the new user password.

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    //4) Generating new token after resetting the password.

    createSendToken(user, 200, res);

});


exports.updatePassword = catchAsync(async(req, res, next) => {
    // 1) get the user from the DB

    const { password, newPassword, newPassConfirm } = req.body;


    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
        return next(new AppError("Wrong email or user doesn't exist", 400));
    }


    // 2) CHeck if the posted user password is correct

    if (!await user.correctPassword(password, user.password)) {
        return next(new AppError("Wrong current password, please try again", 400));
    }
    // 3) Update the password

    user.password = newPassword;
    user.passwordConfirm = newPassConfirm;
    await user.save();

    // 4)Log the user in with new token

    createSendToken(newUser, 200, res);

});