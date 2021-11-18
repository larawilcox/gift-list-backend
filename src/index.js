const serverless = require('serverless-http')
const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const listRouter = require('./routers/list')
const sharecodeRouter = require('./routers/sharecode')

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(userRouter)
app.use(listRouter)
app.use(sharecodeRouter)

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})

module.exports.handler = serverless(app);