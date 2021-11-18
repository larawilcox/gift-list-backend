const mongoose = require('mongoose')

const listSchema = new mongoose.Schema({
    listId: {
        type: String,
        required: true,
        trim: true
    },
    owner: {
        type: String,
        required: true,
        trim: true
    },
    shareCode: {
        type: String,
        required: true,
        trim: true
    }
})

const Sharecode = mongoose.model('Sharecode', listSchema)

module.exports = Sharecode