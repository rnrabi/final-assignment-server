const express = require('express');
const app = express()
const cors = require('cors')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
// middle ware
app.use(cors({
    origin: ['http://localhost:5173']
}))
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.rjjtc94.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const usersCollection = client.db('medicine').collection('users')
        const allMedicineCollection = client.db('medicine').collection('allMedicine')
        const cartsCollection = client.db('medicine').collection('carts')
        const advertiseCollection = client.db('medicine').collection('advertise')

        app.get('/allMedicine', async (req, res) => {
            const result = await allMedicineCollection.find().toArray();
            res.send(result)
        })

        app.get('/specific/:category', async (req, res) => {
            const { category } = req.params;
            const query = { category: category }
            console.log(query)
            const result = await allMedicineCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/allMedicine/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await allMedicineCollection.findOne(query)
            res.send(result)
        })

        app.get('/allMedi/:email', async (req, res) => {
            const userEmail = req.params.email;
            const query = { 'seller.email': userEmail }
            const result = await allMedicineCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/myCarts/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await cartsCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/myAdvertise', async (req, res) => {
            const result = await advertiseCollection.find().toArray()
            res.send(result)
        })

        app.get('/myAdvertise/:email', async (req, res) => {
            const sellerEmail = req.params.email;
            const query = { sellerEmail: sellerEmail }
            const result = await advertiseCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/allUsers', async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })

        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await usersCollection.findOne(query)
            res.send(result)
        })

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            // console.log(query)
            const user = await usersCollection.findOne(query)
            // console.log(user)
            let roll = 'User';

            if (user) {
                if (user.roll === 'Admin') {
                    roll = 'admin';
                } else if (user.roll === 'Seller') {
                    roll = 'seller';
                }
                else if (user.roll === 'User') {
                    roll = 'user'
                }
            }

            res.send({ roll });
        })

        app.put('/user/:id', async (req, res) => {
            const user = req.body;
            const id = user.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    roll: user.roll
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const userEmail = user.email;
            console.log(userEmail)
            const query = { email: userEmail }
            const existingUser = await usersCollection.findOne(query)
            if (existingUser) {
                return res.send('user already exist')
            }
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        app.post('/myCarts', async (req, res) => {
            const cartInfo = req.body;
            const result = await cartsCollection.insertOne(cartInfo)
            res.send(result)
        })

        app.post('/allMedicine', async (req, res) => {
            const user = req.body;
            const result = await allMedicineCollection.insertOne(user)
            res.send(result)
        })

        app.post('/advertise', async (req, res) => {
            const advetisement = req.body;
            const result = await advertiseCollection.insertOne(advetisement)
            res.send(result)
        })

        // delete api 
        app.delete('/allMedicine/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: new ObjectId(id) }
            const result = await allMedicineCollection.deleteOne(query)
            res.send(result)
        })

        app.delete('/myCarts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await cartsCollection.deleteOne(query);
            res.send(result)
        })







        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('final assignment is running')
})
app.listen(port, () => {
    console.log('final assignment is running in port', port)
})