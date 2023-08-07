const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0mmsquj.mongodb.net/?retryWrites=true&w=majority`;

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
        const newToysCollection = client.db('toyMarketUser').collection('newToys');
        const toyCollection = client.db('toyMarketUser').collection('allToys')

        const categoriesCollection = client.db('toyMarketUser').collection('categories');

        app.post('/addtoy', async (req, res) => {
            const newToy = req.body; // Assuming your client sends the new toy data in the request body

            try {
                const result = await newToysCollection.insertOne(newToy); // Use the new collection
                res.status(201).json(result);
            } catch (error) {
                res.status(500).send("Error adding the toy.");
            }
        });

        app.get('/allnewtoys', async (req, res) => {
            try {
                const cursor = newToysCollection.find();
                const result = await cursor.toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send("Error fetching toys.");
            }
        });

        app.get('/alltoys', async (req, res) => {
            const cursor = toyCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/alltoys/:id', async (req, res) => {
            const requestedId = req.params.id; // Get the id parameter from the request
            try {
                const cursor = toyCollection.find({ _id: new ObjectId(requestedId) });
                const result = await cursor.toArray();

                if (result.length > 0) {
                    res.send(result);
                } else {
                    res.status(404).send("Toy not found.");
                }
            } catch (error) {
                res.status(500).send("Error fetching the toy.");
            }
        });


        app.get('/categories', async (req, res) => {
            const cursor = categoriesCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/categories/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                "subcategories.toys.id": id
            };

            try {
                const result = await categoriesCollection.findOne(query);

                if (result) {
                    // The toy with the specified ID was found
                    const subcategories = result.subcategories;
                    let foundToy = null;

                    subcategories.forEach(subcategory => {
                        const toys = subcategory.toys;
                        foundToy = toys.find(toy => toy.id === id);
                        if (foundToy) {
                            // Break the loop if the toy is found
                            return;
                        }
                    });

                    if (foundToy) {
                        res.send(foundToy);
                    } else {
                        res.status(404).send("Toy not found.");
                    }
                } else {
                    res.status(404).send("Category not found.");
                }
            } catch (error) {
                res.status(500).send("Error finding the toy.");
            }
        });


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
    res.send('car market place is running')
})

app.listen(port, () => {
    console.log(`Car Doctor Server is running on port ${port}`)
})