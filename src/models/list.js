const mongoose = require('mongoose')

const listSchema = new mongoose.Schema({
    listName: {
        type: String,
        required: true,
        trim: true
    },
    occasionDate: {
        type: String
    },
    listItems: [{
        item: {
            type: String,
            required: true,
            trim: true
        },
        detail: {
            type: String,
            trim: true
        },
        price: {
            type: String,
            required: true
        },
        links: [{
            linkDescription: {
                type: String,
                trim: true
            },
            link: {
                type: String
            }
        }]
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    } 
},
    {
        timestamps: true
    }
)

const List = mongoose.model('List', listSchema)

module.exports = List