const express = require('express')
const List = require('../models/list')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/lists', auth, async (req, res) => {
    const list = new List({
        ...req.body,
        owner: req.user._id
    })

    try {
        await list.save()
        res.status(201).send(list)
    } catch (e) {
        res.status(400).send(e)
    }

})

router.post('/lists/:id', auth, async (req, res) => {
    try {
        const list = await List.findOne({ _id: req.params.id, owner: req.user._id})

        if (!list) {
            return res.status(404).send()
        }
        
        list.listItems = [
            ...list.listItems,
            req.body
        ]
        await list.save()
        res.send(list)
    } catch (e) {
        res.status(500).send()
        console.log(e)
    }
})

router.get('/lists', auth, async (req, res) => {
    try {
        const lists = await List.find({ owner: req.user._id })
        res.send(lists)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/lists/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const list = await List.findOne({ _id, owner: req.user._id })

        if (!list) {
            return res.status(404).send()
        }

        res.send(list)
    } catch (e) {
        res.status(500).send()
    }
})

router.patch('/lists/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['listName', 'occasionDate']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates!"})
    }

    try {
        const list = await List.findOne({ _id: req.params.id, owner: req.user._id})

        if (!list) {
            return res.status(404).send()
        }

        updates.forEach((update) => list[update] = req.body[update])
        await list.save()

        res.send(list)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.patch('/lists/:listId/listItem/:itemId', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['item', 'detail', 'price', 'links']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates!"})
    }

    try {
        const list = await List.findOne({ _id: req.params.listId, owner: req.user._id})

        if (!list) {
            return res.status(404).send()
        }

        const listItem = list.listItems.find((item) => {
            return item._id.toString() === req.params.itemId
        })

        if (!listItem) {
            return res.status(404).send()
        }

        updates.forEach((update) => listItem[update] = req.body[update])
        await list.save()

        res.send(list)
    } catch (e) {
        res.status(400).send(e)
        console.log(e)
    }
})


router.delete('/lists/:id', auth, async (req, res) => {
    try {
        const list = await List.findOneAndDelete({ _id: req.params.id, owner: req.user._id })

        if (!list){
            return res.status(404).send()
        }

        res.send(list)
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
})

router.delete('/lists/:listId/listItem/:itemId', auth, async (req, res) => {
    try {
       const list = await List.findById({ _id: req.params.listId })

       if (!list){
            return res.status(404).send()
        }
       

       const listItems = list.listItems.filter((item) => {
            return item._id.toString() !== req.params.itemId
       })

        list.listItems = listItems
        await list.save()
        
        res.send(list)
        
    } catch (e) {
        res.status(500).send()
        console.log(e)
    }
})

router.delete('/lists/:listId/listItem/:itemId/link/:linkId', auth, async (req, res) => {
    try {
       const list = await List.findById({ _id: req.params.listId })
        
       if (!list){
            return res.status(404).send()
        }
        
        const listItem = list.listItems.find((item) => {
            return item._id.toString() === req.params.itemId
        })

        const listItemIndex = list.listItems.findIndex((item) => {
            return item._id.toString() === req.params.itemId
        }) 

        if (!listItem) {
            return res.status(404).send()
        }
       
        const itemLinks = listItem.links.filter((link) => {
            return link._id.toString() !== req.params.linkId
        })

        list.listItems[listItemIndex].links = itemLinks
        await list.save()
     
        res.send(list)
        
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router