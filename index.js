const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pgsiu4c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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
        // await client.connect();

        const foodItemsCollection = client.db('cuisine-quest').collection('food-items')

        app.get('/items', async (req, res) => {
            const cursor = foodItemsCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.post('/items', async (req, res) => {
            const newItem = req.body
            const result = await foodItemsCollection.insertOne(newItem)
            res.send(result)
        })

        app.get('/item/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await foodItemsCollection.findOne(query)
            res.send(result)
        })
        app.get('/items/:name', async (req, res) => {
            const name = req.params.name
            // console.log(name)
            const query = { name }
            const cursor = foodItemsCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('cuisine quest server is running')
})

app.listen(port, () => {
    console.log(`cuisine quest server is running on port ${port}`)
})