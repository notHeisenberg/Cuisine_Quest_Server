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
        const feedBackCollection = client.db('cuisine-quest').collection('feeback')
        const purchasesCollection = client.db('cuisine-quest').collection('purchases');

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
            // console.log(query)
            const result = await foodItemsCollection.findOne(query)
            res.send(result)
        })
        app.get('/items/item/:name', async (req, res) => {
            try {
                const name = req.params.name
                const query = { name }
                // console.log(query)
                const cursor = foodItemsCollection.find(query)
                const result = await cursor.toArray()
                res.send(result)
            } catch (error) {
                res.send(error)
            }
        })




        app.patch('/items/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const update = req.body;

            // Fields to be unset (removed)
            // const fieldsToRemove = {
            //     description: "",
            //     processingTime: "",
            //     status: "",
            //     subcategory: ""
            //     // Add more fields to remove here if needed
            // };
            const updatedCraft = {
                $set: {
                    name: update.name,
                    image: update.image,
                    catagory: update.catagory,
                    quantity: update.quantity,
                    price: update.price,
                    origin: update.origin,
                    description: update.description,
                    purchaseCount: update.purchaseCount,
                },
                // $unset: fieldsToRemove // Use $unset to remove fields
            }

            const result = await foodItemsCollection.updateOne(filter, updatedCraft, options)
            res.send(result)
        })

        app.delete('/items/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await foodItemsCollection.deleteOne(query)
            res.send(result)
        })


        // match user and s items 
        app.get('/items/user/:email', async (req, res) => {
            const email = req.params.email
            const items = await foodItemsCollection.find({ email }).toArray();

            res.send(items)
        });

        // Feedback api
        app.put('/item/feedback/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const update = req.body;


            const feedback = {
                $set: {
                    displayName: update.displayName,
                    feedbackImage: update.feedbackImage,
                    feedBack: update.feedBack,
                    email: update.email,

                },
                // $unset: fieldsToRemove // Use $unset to remove fields
            }

            const result = await feedBackCollection.updateOne(filter, feedback, options)
            res.send(result)
        })

        // Purchase related api
        app.post('/purchase', async (req, res) => {
            const { name, price, quantity, date, displayName, email } = req.body;

            try {
                // Find the food item by name
                const foodItem = await foodItemsCollection.findOne({ name });

                if (!foodItem) {
                    return res.status(404).send({ message: 'Food item not found' });
                }

                // Check if the requested quantity is available
                if (foodItem.quantity < quantity) {
                    return res.status(400).send({ message: 'Requested quantity exceeds available stock' });
                }

                // Increment the purchase count
                const updateResult = await foodItemsCollection.updateOne(
                    { _id: foodItem._id },
                    {
                        $inc: {
                            purchaseCount: 1,
                            quantity: -quantity
                        }
                    }
                );

                if (updateResult.modifiedCount === 0) {
                    return res.status(500).send({ message: 'Failed to update purchase count' });
                }

                // Store the purchase details in a separate collection or log
                const purchaseDetails = {
                    name,
                    price,
                    quantity,
                    displayName,
                    email,
                    date
                };

                const result = await purchasesCollection.insertOne(purchaseDetails);

                res.send({ message: 'Purchase successful', purchaseId: result.insertedId });
            } catch (error) {
                console.error('Error processing purchase:', error);
                res.status(500).send({ message: 'Internal server error' });
            }
        })

        // User wise purchase
        app.get('/purchases/:email', async (req, res) => {
            const { email } = req.params;

            try {
                // Find all purchases by the user's email
                const purchases = await purchasesCollection.find({ email }).toArray();

                if (!purchases.length) {
                    return res.status(404).send({ message: 'No purchases found for this user' });
                }

                res.send(purchases);
            } catch (error) {
                console.error('Error retrieving purchases:', error);
                res.status(500).send({ message: 'Internal server error' });
            }
        });


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