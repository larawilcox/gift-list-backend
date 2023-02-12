const express = require('express')
const mongoose = require('mongoose')
const User = require('../models/user')
const List = require('../models/list')
const Sharecode = require('../models/sharecode')
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
        console.log('this is working')
        //delete all copies of users lists from other users subscribed lists array
        const subscribers = await User.updateMany({}, { $pull: { subscribedLists: {owner: req.user._id }}})
        console.log(subscribers)

        
        //delete lists owned by the user
        const lists = await List.deleteMany({ owner: req.user._id })
        
        //delete sharecodes created by the user
        const sharecodes = await Sharecode.deleteMany({ owner: req.user._id })

        //delete the user
        await req.user.remove()

        res.send(req.user)
    } catch (e) {
        console.log(e)
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

router.patch('/users/me/subscribedLists/fix', auth, async (req, res) => {
    try {
        const owners = new Set()
        const fixedLists = []
        req.user.subscribedLists.forEach((list) => {
            if (owners.has(list.owner)) {
                const ownerGroup = fixedLists.find((fixedList => fixedList.owner === list.owner))
                ownerGroup.lists = ownerGroup.lists.concat(list.lists)
            } else {
                owners.add(list.owner)
                fixedLists.push(list)
            }
        })
        req.user.subscribedLists = fixedLists
        req.user.save()
        res.status(200).send()
    } catch (e) {
        res.status(500).send(e)
        console.log(e)
    }
})

router.patch('/users/me/subscribedLists/:ownerId/lists/:listId', auth, async (req, res) => {
    try {
        console.log(req.params)
        const unsubscribeOwner = req.user.subscribedLists.find(owner => owner.owner === req.params.ownerId)
        console.log('Owner', unsubscribeOwner)
        if (!unsubscribeOwner) {
            return res.status(404).send()
        }

        const subscribedLists = unsubscribeOwner.lists.filter(listId => listId !== req.params.listId)
        console.log('remaining lists', subscribedLists)

        if (subscribedLists.length > 0) {
            unsubscribeOwner.lists = subscribedLists
            
        } else {
            const subscribedOwners = req.user.subscribedLists.filter(owner => owner.owner !== req.params.ownerId)
            req.user.subscribedLists = subscribedOwners
        }
        await req.user.save()
        res.send(subscribedLists)
    }
    catch (e) {
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