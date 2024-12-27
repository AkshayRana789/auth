
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.urlencoded({extended:true}));

//Imports Routes
const authRouter = require('./routes/authRouter');
const postRouter = require('./routes/postRouter');

//Use Routes
app.use("/api/auth",authRouter);
app.use("/api/posts",postRouter);

mongoose.connect(process.env.MONGO_URL).then(()=>{
    console.log('DB connected');
}).catch((error)=>{
    console.log(`DB Error ${error}`);
});

app.get("/",(req,res) => {
    res.json({message:"API server connected."})
});

PORT = process.env.PORT;

app.listen(PORT,()=>{
    console.log('Server Connectd..');
});