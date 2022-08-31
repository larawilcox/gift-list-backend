const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const resetpasswordSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    resetCode: {
        type:  String,
        required: true,
        trim: true
    },
    expiryDate: {
        type: String,
        required: true
    }
})

//Hash the plain text password before saving
resetpasswordSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

const Resetpassword = mongoose.model('Resetpassword', resetpasswordSchema)

module.exports = Resetpassword