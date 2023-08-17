const express = require('express')
const mongoose = require('mongoose')

const authRouser = require('./authRouter')

const PORT = process.env.PORT || 5000

const app = express()


app.use(express.json())
app.use('/auth', authRouser)

const start = async () => {
    try {
        mongoose.connect('mongodb+srv://qwerty:qwerty-1@cluster.ojqn6ay.mongodb.net/admin_panel?retryWrites=true&w=majority')
        app.listen(PORT, () => console.log(`SERVER STARTED ON PORT ${PORT}`))
    } catch (error) {
        console.log(error);
    }
}
start()