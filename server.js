const mongoose = require('mongoose');
require('dotenv').config();
const app = require('./app');

const port = process.env.PORT || 1717;
const DB = process.env.DATABASE.replace("<password>", process.env.DATABASE_PASS);

mongoose.connect(DB, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false })
    .then(() => console.log("DB connection successful"));

process.on('uncaughtException', err => {
    console.log('Uncaught exception, app BOOM 💥');
    console.log(err);
    process.exit(1); //0 stands for success 1 stands for uncaught exception

});

const server = app.listen(port, () => {
    console.log(`Server is listening on port ${port} 👋`);
});


//If there's any unhandled promise rejection, it will be globally processed and logged here.
process.on("unhandledRejection", (err) => {
    console.log('Unhandled rejection, app BOOM 💥');
    console.log(err);
    server.close(() => {
        console.log('Server is closing Sadge');
        process.exit(1); //0 stands for success 1 stands for uncaught exception
    });
});