const express = require('express')
const User = require('../models/user')
const List = require('../models/list')
const Sharecode = require('../models/sharecode')
const auth = require('../middleware/auth')
const router = new express.Router()


//puts a code/list combo in the database when a code is shared with a friend
router.post('/sharecodes', auth, async (req, res) => {
    const sharecode = new Sharecode({
        ...req.body,
        owner: req.user._id
    })

    try {
        await sharecode.save()
        res.status(201).send(sharecode)
    } catch (e) {
        res.status(400).send(e)
    }

})

//puts a listId into subscribed to lists array on user. Does this need to be done in the user model?? I think so.


router.patch('/users/me/subscribedLists', auth, async (req, res) => {
        console.log('req: ', req.body.shareCode)

    try {
        const sharecode = req.body.shareCode
        const listToAdd = await Sharecode.findOne({ shareCode: sharecode })

        const addedListOwner = req.user.subscribedLists.find((subscription) => subscription.owner === listToAdd.owner)

        if (addedListOwner) {
            addedListOwner.lists.push(listToAdd.listId)
        } else {
            req.user.subscribedLists.push({
                owner: listToAdd.owner,
                lists: [listToAdd.listId]
            })
        }

        await req.user.save()
        res.send(req.user)

    } catch (e) {
        res.status(400).send(e)
        console.log(e)
    }
})


module.exports = router