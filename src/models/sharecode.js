const mongoose = require('mongoose')

const sharecodeSchema = new mongoose.Schema({
    listId: {
        type: String,
        required: true,
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    shareCode: {
        type:  String,
        required: true,
        trim: true
    }
})

const Sharecode = mongoose.model('Sharecode', sharecodeSchema)

module.exports = Sharecode