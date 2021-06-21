const express = require("express");
const morgan = require("morgan");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const AppError = require("./utilities/appError");
const errorHandler = require("./controllers/errorController");
const rateLimit = require('express-rate-limit');
const helmet = require("helmet");
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const app = express();


if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

app.use(express.json({ limit: '100kb' }));


//Mongo sanitizer preventing NoSQL query injections
app.use(mongoSanitize());

//Data sanitization for req.body, req.query and req.params, from javascript or html code
app.use(xss());

// IP request rate limiting middleware
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, //1 hour until reset
    max: 100 //100 requests from the same IP per hour 
});

app.use(helmet({
    contentSecurityPolicy: false,
    referrerPolicy: { policy: "no-referrer" }
}));

app.use('/api', limiter);

// app.use((req, res, next) => {
//     console.log("Hello Drip! Salute from the middleware 👋");
//     next();
// });

app.use((req, res, next) => {
    req.requestedTime = new Date().toISOString();
    next();
})


app.use(express.static("./public"));

app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
console.log(process.env.NODE_ENV);


app.all("*", (req, res, next) => {

    next(new AppError(`Url that you requested ${req.url} doesn't exist..`, 404));

});
//Global error handling middleware
app.use(errorHandler);

module.exports = app;