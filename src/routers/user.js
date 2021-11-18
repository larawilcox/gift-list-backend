const express = require('express')
const mongoose = require('mongoose')
const User = require('../models/user')
const List = require('../models/list')
const auth = require('../middleware/auth')
const router = new express.Router()


router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['forename', 'surname', 'email', 'password', 'subscribedLists']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates!"})
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/users/me/subscribedLists', auth, async (req, res) => {
    try {
        const lists = req.user.subscribedLists.map((list) => list.lists.map((listId) => {
              return mongoose.Types.ObjectId(listId)
            })
        ).flat()
        const subscribedLists = await List.find({ _id: {$in: lists}})
            console.log(subscribedLists)

        const owners = req.user.subscribedLists.map((list) => list.owner)
        const subscribedOwners = await User.find({_id: {$in: owners}})
        
        //structure the data response to fit the app
        const subscribedListsData = subscribedOwners.map((owner) => {
            const ownersLists = subscribedLists.filter(list => list.owner.toString() === owner._id.toString())
        
            return {
                _id: owner._id,
                forename: owner.forename,
                surname: owner.surname,
                email: owner.email,
                lists: ownersLists
            }
        })

        res.send(subscribedListsData)
    } catch (e) {
        res.status(500).send(e)
        console.log(e)
    }
})

router.get('/users/me/shoppingList', auth, async (req, res) => {
    try {
        const lists = req.user.subscribedLists.map((list) => list.lists.map((listId) => {
              return mongoose.Types.ObjectId(listId)
            })
        ).flat()
        const subscribedLists = await List.find({ _id: {$in: lists}})
        console.log("shopping list", subscribedLists)
        //get to the actions on each listItem and build array of items that we have marked taken
        const shoppingList = subscribedLists.map((list) => {
                const myItems = list.listItems.filter((item) => item.actions && item.actions.personId && item.actions.personId.toString() === req.user._id.toString())
                return {
                    listId: list._id,
                    listName: list.listName,
                    items: myItems,
                    owner: list.owner
                }
            }
        )
        console.log('user id', req.user._id)
        console.log('shopping list', shoppingList)
        

        const owners = req.user.subscribedLists.map((list) => list.owner)
        const subscribedOwners = await User.find({_id: {$in: owners}})
        console.log(subscribedOwners)
        //structure the data response to fit the app
        const shoppingListData = subscribedOwners.map((owner) => {
            const ownersItems = shoppingList.filter(item => item.owner.toString() === owner._id.toString())
        
            return {
                _id: owner._id,
                forename: owner.forename,
                surname: owner.surname,
                email: owner.email,
                lists: ownersItems
            }
        })
        console.log('Shopping List', shoppingListData)
        res.send(shoppingListData)
    } catch (e) {
        console.log(e)
        res.status(500).send(e)
    }
})

module.exports = router