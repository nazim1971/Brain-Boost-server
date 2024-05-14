const express = require('express');
const cors = require('cors');
require('dotenv').config();

const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
  
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// CORS
const corsOption = {
    origin: ['http://localhost:5173','https://brainboost-e787c.web.app','https://brainboost-e787c.firebaseapp.com'],
    credentials: true,
    optionSuccessStatus: 200,
}

// middle wire
app.use(cors(corsOption))
app.use(express.json())
app.use(cookieParser())


// verify jwt middlewire

const verifyToken = (req,res,next)=>{
  const token = req.cookies?.token;
  if(!token) return res.status(401).send({message: 'Unauthorized access '})

          if(token){
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err,decoded )=>{
              if(err){
                return res.status(401).send({message: 'Unauthorized access '})
              }
              req.user = decoded;
              next()
            })
          } 
}

// mongo DB



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uwjhzip.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

        // database 
        const assignmentCollection = client.db('brainDB').collection('allAssign');
        const doneCollection = client.db('brainDB').collection('doneAssign');
        const populerCollection = client.db('brainDB').collection('populerAssign');

        // jwt
        app.post('/jwt',async(req,res)=>{
          const user = req.body;
          const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{
            expiresIn: '7d'
          } )
          res.cookie('token', token,{
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", 
            sameSite: process.env.NODE_ENV === 'production'? 'none' : 'strict' 

          }).send({success: true})
        })

        // clear token after logout

        app.get('/logout', (req,res)=>{
          res.clearCookie(
            'token',{
              httpOnly: true,
            secure: process.env.NODE_ENV === "production", 
            sameSite: process.env.NODE_ENV === 'production'? 'none' : 'strict' ,
            maxAge: 0,
            } ,{withCredentials: true}).send({success: true})
        })

        // get all assignment
        app.get('/allPost',async(req,res)=>{
            const result = await assignmentCollection.find().toArray()
            res.send(result)
        } )

        // get posted assiment by id 
        app.delete('/userPost/:id', async(req,res)=>{
            const id = req.params.id;
            const query = {_id : new ObjectId(id) };
            const result = await assignmentCollection.deleteOne(query);
            res.send(result)
        } )


        // add all posted assignment in db
        app.post('/allAssign',verifyToken,async(req,res)=>{
            const assignmentData = req.body;
            const result = await assignmentCollection.insertOne(assignmentData);
            res.send(result)
        })

        // done all assignent add to the db
        app.post('/doneAssign',async(req,res)=>{
          const assignmentData = req.body;
          const result = await doneCollection.insertOne(assignmentData);
          res.send(result)
        }) 

        // get all pending assigment
        app.get('/pending',verifyToken,async(req,res)=>{
          const result = await doneCollection.find({status: 'pending'}).toArray()
          res.send(result)
        })
        // get pending assign details by id
        app.get('/pending/:id',verifyToken,async(req,res)=>{
          const id = req.params.id
          const query = {_id : new ObjectId(id)}
          const result = await doneCollection.findOne(query)
          res.send(result)

        })
        // get my attempted assignment
        app.get('/getAssign/:email',verifyToken,async(req,res)=>{
          const tokenData = req.user.email
          const email = req.params.email;
          if(tokenData !== email){
            return res.status(403).send({message: 'Forbidden access'})
          }
          const query = {"doneUserEmail": email};
          const result = await doneCollection.find(query).toArray()
          res.send(result)
        })

    // update pending item in db
    app.put('/updatePending/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const assignmentData = req.body
      const option = {upsert: true};
      const updateDoc = {
        $set: {
          ...assignmentData,
        },
      }
      const result = await doneCollection.updateOne(query, updateDoc , option);
      res.send(result)
    })


            // update assignment data in db
    app.put('/updatePost/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const assignmentData = req.body
      const option = {upsert: true};
      const updateDoc = {
        $set: {
          ...assignmentData,
        },
      }
      const result = await assignmentCollection.updateOne(query, updateDoc , option);
      res.send(result)
    })

        // get single assignment data
        app.get('/onePost/:id',verifyToken,async(req,res)=>{
          const id = req.params.id
          const query = {_id : new ObjectId(id)}
          const result = await assignmentCollection.findOne(query)
          res.send(result)
        })

        // get populer assignment data from populerAssign collection

        app.get('/populer', async(req,res)=>{
          const result = await populerCollection.find().toArray()
          res.send(result)
        })

        // get single populer data by id
                app.get('/populer/:id',verifyToken,async(req,res)=>{
                  const id = req.params.id
                  const query = {_id : new ObjectId(id)}
                  const result = await populerCollection.findOne(query)
                  res.send(result)
        
                })
         

    
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
  }
}
run().catch(console.dir);



app.get('/', (req,res)=>{
    res.send('My brain-boost server is running')
})

app.listen(port , ()=>{
    console.log(`my server use port: ${port}`);
} )