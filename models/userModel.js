const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    email:{
        type:String,
        required:[true,'Email Id is required'],
        trim:true,
        unique:[true,'Email Id should be unique'],
        minLenght:[5,"Email Id more then 5 Character"],
        lowercase: true,
    },
    password:{
        type:String,
        required:[true,'Password is required'],
        trim:true,
        select:false,
    },
    verified:{
        type:Boolean,
        default:false,
    },
    verificationCode:{
        type:String,
        select:false,
    },
    verificationCodeValidation:{
        type:Number,
        select:false,
    },
    forgotpasswordCode:{
        type:String,
        select:false,
    },
    forgotpasswordValidation:{
        type:Number,
        select:false,
    },
},{
    timestamps:true,
});

module.exports = mongoose.model("User",userSchema);