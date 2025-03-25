const express = require('express')
const mongoose = require('mongoose')
const { url_db } = require('./config')
const authRouter = require('./authRouter')
const cors = require('cors')

const PORT = process.env.PORT || 3000
const app = express()


app.use(express.json())

app.use(cors({
    // origin: 'http://3.125.43.47:5173',
    origin: ['http://localhost:5173', 'http://127.0.0.1:5500'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}))

app.use('/api/User', authRouter)

const start = async () => {
    try {
        mongoose.connect(url_db)
        app.listen(PORT, () => console.log(`SERVER STARTED ON PORT ${PORT} OK`))
    } catch (error) {
        console.log(error);
    }
}
start()
