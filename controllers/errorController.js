const AppError = require("../utilities/appError");

const handleCastErrorDB = error => {
    let message = `You've input an invalid ID of -> ${error.value}`;
    return new AppError(message, 404);
}

const handleDuplicatesDB = error => {
    let message = `You're trying to input a duplicate value -> '${error.keyValue.name}'. Please change the name.`
    return new AppError(message, 400);
}

const sendErrorDev = (err, res) => {
    // console.log(err.keyValue.name);
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        name: err.name,
        message: err.message,
        stack: err.stack
    });
}

const handleJWTError = () => {
    return new AppError("Invalid token, please login again.", 401);
}

const handleTokenExpired = () => {
    return new AppError("Session token has expired, please login again", 401);
}

const sendErrorProd = (err, res) => {

    //For operational errors (invalid route, input invalid data, wrong ID etc..)
    if (err.isOperational) {

        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }
    //No details will be leaked to the client
    else {

        // console.error("Error", err);

        res.status(500).json({
            status: 'error',
            message: 'Something went wrong..'
        });
    }
}

const handleValidationErrorDB = (err) => {

    return new AppError(`${err.name}`, 404);
}



module.exports = (err, req, res, next) => {

    err.status = err.status || "error";
    err.statusCode = err.statusCode || 500;

    if (process.env.NODE_ENV === "development") {
        sendErrorDev(err, res);
        // console.log(err.name);
    } else if (process.env.NODE_ENV === "production ") {
        let error = {...err };
        if (err.name === "CastError") error = handleCastErrorDB(error);
        if (err.code === 11000) error = handleDuplicatesDB(error);
        if (err.name === "ValidationError") error = handleValidationErrorDB(error);
        if (err.name === "JsonWebTokenError") error = handleJWTError();
        if (err.name === "TokenExpiredError") error = handleTokenExpired();
        sendErrorProd(error, res);
    }

}