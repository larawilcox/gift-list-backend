const express = require('express')
const Resetpassword = require('../models/resetpassword')
const User = require('../models/user')
const router = new express.Router()
const add = require('date-fns/add')
var compareAsc = require('date-fns/compareAsc')
const nanoidModule = import('nanoid/non-secure')
var SibApiV3Sdk = require('sib-api-v3-sdk')
var defaultClient = SibApiV3Sdk.ApiClient.instance

// Configure API key authorization: api-key
var apiKey = defaultClient.authentications['api-key']
apiKey.apiKey = process.env.SIB_API_KEY

const BASE_URL = process.env.BASE_URL


//puts a code/list combo in the database when a code is shared with a friend
router.post('/resetpassword', async (req, res) => {
    try {
        const user = await User.findOne({email: req.body.email})
        const date = new Date()
        const expiryDate = add(date, {days: 1})
        const { customAlphabet } = await nanoidModule
        const nanoid = customAlphabet('1234567890abcdef', 10)
        const code = nanoid();
            const resetpassword = new Resetpassword({
                ...req.body,
                owner: user._id,
                expiryDate,
                resetCode: code, 
            })
        await resetpassword.save()

        var apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()

        sendSmtpEmail = {
            to: [{
                email: req.body.email,
                name: user.forename + ' ' + user.surname
            }],
            templateId: 2,
            params: {
                name: user.forename,
                url: `${BASE_URL}/change-password?resetcode=${code}`
            }
        };
        await apiInstance.sendTransacEmail(sendSmtpEmail).then(function(data) {
            console.log('Email API called successfully.')
          }, function(error) {
            console.log(error);
          });

        res.status(200).send()
    } catch (e) {

        res.status(400).send(e)
    }

})

router.patch('/changepassword', async (req, res) => {

    try {
        //find user using reset code
        const userReset = await Resetpassword.findOne({resetCode: req.body.resetcode})
        
        //error handling - can't find reset code - send back 404 not found, handle that in front end (click forgot password again)
        if (!userReset) {
            return res.status(400).send({error: "Reset code not found"})
        }

        //error handling - user is there, code expired - different error code but click forgot password again
        if (compareAsc(new Date(userReset.expiryDate), new Date()) === -1) {
            return res.status(400).send({error: "Reset code expired"})
        }

        //find user is the Users collection
        const user = await User.findOne({_id: userReset.owner})

        //error handling - can't find user - as above, same
        if (!user) {
            return res.status(400).send({error: "User not found"})
        }
        
        //update password for that user (hashing along the way) 
        console.log('PWUser: ', user)

        user.password = req.body.password
        await user.save()

        //delete reset code - single use only
        const resetCodes = await Resetpassword.deleteOne({resetCode: req.body.resetcode})
        
        
        res.send(user)
    } catch (e) {
        //error handling - user is there, date ok, update fails for some reason - send back 500?? - something went wrong. Please try again.
        res.status(500).send({error: "Something went wrong. Please try again."})
    }

    
})

module.exports = router