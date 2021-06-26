const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require("validator");
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required, please enter it.']
    },
    email: {
        type: String,
        required: [true, 'Please, enter your E-mail...'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'It must be a valid e-mail']
    },
    password: {
        type: String,
        required: [true, 'Password should be provided!'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Password needs to be confirmed!'],
        validate: {
            validator: function(el) {
                return el === this.password;
            },
            message: "The passwords do not match, input again!"
        }

    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    passwordChangedAt: {
        type: Date
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    photo: String,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', async function(next) {

    //It will only proceed to run this middleware if the password has been modified;
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined; //not saving passwordConfirm to the DB after validation;
    next();
});

//Pre-save middleware that checks if password has been modified, and if so, adds a date timestamp.
userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) {
        return next();
    }

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

//User pre middleware to find only the users with 'active' status different than 'false'.
userSchema.pre(/^find/, function(next) {
    this.find({ active: { $ne: false } }); //this points to the current query

    next();
})

// Method for user's password comparison.
userSchema.methods.correctPassword = async function(candidatePass, userPass) {
    return await bcrypt.compare(candidatePass, userPass);

}

//This method checks if the password has been changed after issuing the token by passing token timestamp
userSchema.methods.changedPassword = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTTimestamp < changedTimestamp;
    }

    //If function returns false, that means the password hasn't been changed after the token has been issued.
    return false;
}

// Method for creating a password reset token with the expiration time of 10 minutes
userSchema.methods.createPasswordResetToken = function() {

    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    console.log({ resetToken }, this.passwordResetToken);
    this.passwordResetExpires = Date.now() + 600 * 1000;

    return resetToken;

}

const User = new mongoose.model('User', userSchema);




module.exports = User;