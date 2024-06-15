const express = require('express');
const app = express()
const cors = require('cors')
require('dotenv').config();
const jwt = require('jsonwebtoken')
const stripe = require("stripe")(`${process.env.Strip_api_key}`);
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
        const bookingCollection = client.db('medicine').collection('booking')
        const bannerCollection = client.db('medicine').collection('banner')

        // jwt api .......... 
        app.post('/jwt', async (req, res) => {
            const tokenInfo = req.body;
            const token = jwt.sign(tokenInfo, `${process.env.Access_token_secret}`, { expiresIn: '2h' })
            res.send({ token })
        })

        // verify token and middle ware
        const verifyToken = async (req, res, next) => {
            // console.log('inside token is:', req.headers.authorization)
            const token = req.headers.authorization?.split(' ')[1];
            // console.log(token)
            if (!token) {
                return res.status(401).send({ message: 'unauthorize access' })
            }
            jwt.verify(token, process.env.Access_token_secret, (err, decoded) => {
                if (err) {
                    return res.status(403).send({ message: 'forbidden access' })
                }
                req.user = decoded;
                next()
            })
        }

        // verify Admin ............ 
        const verifyAdmin = async (req, res, next) => {
            const email = req.user.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            const isAdmin = user?.roll === "Admin"
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next()
        }

        // verify Seller ............ 
        const verifySeller = async (req, res, next) => {
            const email = req.user.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            const isSeller = user?.roll === "Seller"
            if (!isSeller) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next()
        }



        app.get('/allMedicine', async (req, res) => {
            const page = parseInt(req.query.page) - 1;
            const size = parseInt(req.query.size);
            console.log(page, size)
            const result = await allMedicineCollection.find().skip(page * size).limit(size).toArray();
            res.send(result)
        })

        app.get('/allMedicine-count', async (req, res) => {
            const count = await allMedicineCollection.countDocuments();
            res.send({ count })
        })

        app.get('/specific/:category', async (req, res) => {
            const { category } = req.params;
            const query = { category: category }
            // console.log(query)
            const result = await allMedicineCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/allMedicine/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await allMedicineCollection.findOne(query)
            res.send(result)
        })

        app.get('/allMedi/:email', verifyToken, async (req, res) => {
            const userEmail = req.params.email;
            const query = { 'seller.email': userEmail }
            const result = await allMedicineCollection.find(query).toArray()
            res.send(result)
        })


        app.get('/allImage', async (req, res) => {
            const query = { 'admin.email': 'rabi@sabi.com' }
            const adminAdded = await allMedicineCollection.find(query).toArray()
            const result = adminAdded.map(admin => admin.image)
            res.send(result)
        })

        // banner get api one
        app.get('/banner', async (req, res) => {
            const result = await bannerCollection.find().toArray()
            res.send(result)
        })

        app.get('/carts', verifyToken, async (req, res) => {
            const result = await cartsCollection.find().toArray()
            res.send(result)
        })

        app.get('/myCarts/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await cartsCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/myCartsCheckout/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await cartsCollection.find(query).toArray()
            const total = result.reduce((sum, item) => sum + item?.price, 0)
            res.send({ total, products: result.length })
        })

        app.get('/myAdvertise', verifyToken, async (req, res) => {
            const result = await advertiseCollection.find().toArray()
            res.send(result)
        })

        app.get('/myAdvertise/:email', verifyToken, verifySeller, async (req, res) => {
            const sellerEmail = req.params.email;
            const query = { sellerEmail: sellerEmail }
            const result = await advertiseCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/allUsers', verifyToken, verifyAdmin, async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })

        app.get('/user/:email', verifyToken, async (req, res) => {
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
            let roll = 'user';

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

        app.get('/booking', async (req, res) => {
            const result = await bookingCollection.find().toArray()
            res.send(result)
        })

        // here get transaction id
        app.get('/booking/:customerEmail', async (req, res) => {
            const customerEmail = req.params.customerEmail;
            const query = { 'customar.email': customerEmail }
            const result = await bookingCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/bookingProducts', async (req, res) => {

            const options = {
                projection: { _id: 0, products: 1 },
            };

            const result = await bookingCollection.find({}, options).toArray()
            const result1 = result.flatMap(data => data.products)
            res.send(result1)
        })

        app.get('/bookingSeller/:email', async (req, res) => {
            const email = req.params.email;
            // console.log(email)
            const allData = await bookingCollection.find().toArray()
            const products = allData.flatMap(data =>
                data.products.filter(product => product.seller && product.seller.email === email)
            );
            // console.log(products)
            res.send(products)
        })

        app.get('/booking/:email', async (req, res) => {
            const customarEmail = req.params.email;
            const query = { 'customar.email': customarEmail }
            const result = await bookingCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/seller/:email', async (req, res) => {
            const sellerEmail = req.params.email;
            const query = { 'seller.email': sellerEmail }
            const result = await cartsCollection.find(query).toArray()
            res.send(result)
        })

        // discount api 
        app.get('/discount', async (req, res) => {
            const query = { discount: { $gt: 0 } }
            const result = await allMedicineCollection.find(query).toArray();
            res.send(result)
        })


        // payment intent**************
        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;

            // const priceInCent = parseFloat(price) * 100;
            const priceInCents = Math.round(parseFloat(price) * 100);
            // console.log(priceInCents)
            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                amount: priceInCents,
                currency: "usd",
                // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/booking', async (req, res) => {
            const bookingInfo = req.body;
            // console.log(bookingInfo.cartId)
            const result = await bookingCollection.insertOne(bookingInfo)
            const query = {
                _id: {
                    $in: bookingInfo.cartId.map(id => new ObjectId(id))
                }
            }
            const deleteCarts = await cartsCollection.deleteMany(query)

            res.send({ result, deleteCarts })
        })

        app.put('/bookingUpdate/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    adminStatus: 'paid'
                }
            }
            const result = await bookingCollection.updateOne(filter, updateDoc)
            res.send(result)
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
            // console.log(userEmail)
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
            // console.log(cartInfo)
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

        app.patch('/updateCartStatus/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { 'buyer.email': email }
            const updateDoc = {
                $set: {
                    status: 'paid'
                }
            }
            const result = await cartsCollection.updateMany(filter, updateDoc)
            res.send(result)
        })

        // banner post api
        app.put('/banner', async (req, res) => {
            const bannerInfo = req.body;
            const query = { image: bannerInfo.image }
            const exist = await bannerCollection.findOne(query)
            if (exist) {
                return res.send({ exist: true })
            }
            const updateDoc = {
                $set: {
                    status: 'confirm'
                }
            }
            const update = await advertiseCollection.updateOne(query, updateDoc)
            const result = await bannerCollection.insertOne(bannerInfo)
            res.send(result)
        })

        // banner delete api
        app.delete('/banner', async (req, res) => {
            const imageURL = req.query.image;
            // console.log(imageURL)
            const query = { image: imageURL }
            const result = await bannerCollection.deleteOne(query)
            res.send(result)
        })

        // delete api 
        app.delete('/allMedicine/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id)
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

        app.delete('/myAllCarts/:email', async (req, res) => {
            const userEmail = req.params.email;
            const query = { email: userEmail }
            const result = await cartsCollection.deleteMany(query);
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