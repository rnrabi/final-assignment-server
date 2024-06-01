const express = require('express');
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000;
// middle ware
app.use(cors({
    origin: ['http://localhost:5173']
}))
app.use(express.json())







app.get('/', (req, res) => {
    res.send('final assignment is running')
})
app.listen(port, () => {
    console.log('final assignment is running in port', port)
})