const transport = require('../middlewares/sendMail');
const { signupSchema, signinSchema, acceptCodeSchema,changePasswordSchema,acceptFPCodeSchema } = require('../middlewares/validator');
const Users = require('../models/userModel');
const { doHash, doHashValidation, hmacProcess } = require('../utils/hashing');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { error, value } = signupSchema.validate({ email, password });
        if (error) {
            return res.status(401).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const existingUser = await Users.findOne({ email });

        if (existingUser) {
            return res.status(401).json({
                success: false,
                message: "User Already Exist",
            });
        }
        const hasPassword = await doHash(password, 12);
        const newUser = new Users({ email, password: hasPassword });
        const result = await newUser.save();
        result.password = undefined;

        return res.status(201).json({
            success: true,
            message: "User Register Successfully",
            result
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error in Sign Up",
            error
        })
    }
}

exports.signin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { error, value } = signinSchema.validate({ email, password });
        if (error) {
            return res.status(401).json({
                success: false,
                message: error.details[0].message,
            });
        }
        const existingUser = await Users.findOne({ email }).select('+password');

        if (!existingUser) {
            return res.status(401).json({
                success: false,
                message: "Wrong User Credentails",
            });
        }
        const hasPassword = await doHashValidation(password, existingUser.password);

        if (!hasPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid User Credentails",
            });
        }

        const token = jwt.sign({
            userId: existingUser._id,
            email: existingUser.email,
            verified: existingUser.verified
        }, process.env.SECRET, { expiresIn: '8h' });

        return res.cookie('Authorization', 'Bearer ' + token, {
            expires: new Date(Date.now() + 8 * 3600000),
            httpOnly: process.env.NODE_ENV === 'production',
            secure: process.env.NODE_SECURITY === 'production'
        }).json({
            success: true,
            message: "User Login Successfully",
            token
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error in Sign In",
            error
        })
    }
}

exports.signout = async (req, res) => {
    res.clearCookie('Authorization').status(200).json({
        sucess: true,
        message: "Logout Done."
    })
}

exports.sendVerificationCode = async (req, res) => {
    const { email } = req.body;
    try {

        const existingUser = await Users.findOne({ email });

        if (!existingUser) {
            return res.status(401).json({
                success: false,
                message: "User Not Exists!",
            });
        }
        if (existingUser.verified) {
            return res.status(400).json({
                success: false,
                message: "You are alrady verified !",
            });
        }
        const codeValue = Math.floor(Math.random() * 1000000).toString();
        let info = await transport.sendMail({
            from: process.env.EMAIL_USERNAME,
            to: existingUser.email,
            subject: "Verification Code",
            html: '<h1>' + codeValue + '</h1>'
        })
        //console.log(info);
        if (info.accepted[0] === existingUser.email) {
            const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE);
            existingUser.verificationCode = hashedCodeValue;
            existingUser.verificationCodeValidation = Date.now();
            await existingUser.save();
            //console.log(existingUser);
            return res.status(200).json({
                success: true,
                message: "Code Sent!",
            });
        }
        res.status(400).json({
            success: false,
            message: "Code Sent failed!",
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error in Sending Verification Code",
            error
        })
    }
}

exports.verifyVerificationCode = async (req, res) => {
    const { email, providedCode } = req.body;
    try {
        const { error, value } = acceptCodeSchema.validate({ email, providedCode });
        if (error) {
            return res.status(401).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const codeValue = providedCode.toString();
        const existingUser = await Users.findOne({email}).select("+verificationCode +verificationCodeValidation");
        if (!existingUser) {
            return res.status(401).json({
                success: false,
                message: "User Does Not Exists!",
            });
        }
        if (existingUser.verified) {
            return res.status(400).json({
                success: false,
                message: "You are alrady verified !",
            });
        }
        console.log(existingUser)
        if(!existingUser.verificationCode || !existingUser.verificationCodeValidation){
            return res.status(400).json({
                success: false,
                message: "Something is wrong with the code !",
            });
        }
        if(Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000){
            return res.status(400).json({
                success: false,
                message: "Code has been expired !",
            });
        }
        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE)
        if(hashedCodeValue === existingUser.verificationCode){
            existingUser.verified = true;
            existingUser.verificationCode = undefined;
            existingUser.verificationCodeValidation = undefined;
            await existingUser.save();
            return res.status(200).json({
                success: true,
                message: "Your account has been verified !",
            });
        }
        return res.status(400).json({
            success: false,
            message: "Unexpected Occured !",
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error in Verification",
            error
        })
    }
}

exports.changePassword = async (req,res)=>{
    const {userId,verified} = req.user;
    const {oldPassword, newPassword} = req.body;
    try {
        const { error, value } = changePasswordSchema.validate({ oldPassword, newPassword });
        if (error) {
            return res.status(401).json({
                success: false,
                message: error.details[0].message,
            });
        }
        if (!verified) {
            return res.status(401).json({
                success: false,
                message: "You are not verified user !",
            });
        }

        const existingUser = await Users.findOne({_id:userId}).select('+password');

        if (!existingUser) {
            return res.status(401).json({
                success: false,
                message: "User does not exists",
            });
        }

        const hasPassword = await doHashValidation(oldPassword, existingUser.password);

        if (!hasPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid User Credentails",
            });
        }
        const hashedPassword = await doHash(newPassword,12);
        existingUser.password = hashedPassword;
        await existingUser.save();
        return res.status(200).json({
            success: true,
            message: "Password Updated.",
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error in Password Change",
            error
        })
    }
}

exports.sendForgotPasswordCode = async (req, res) => {
    const { email } = req.body;
    try {

        const existingUser = await Users.findOne({ email });

        if (!existingUser) {
            return res.status(401).json({
                success: false,
                message: "User Not Exists!",
            });
        }
        
        const codeValue = Math.floor(Math.random() * 1000000).toString();
        let info = await transport.sendMail({
            from: process.env.EMAIL_USERNAME,
            to: existingUser.email,
            subject: "Forgot password code",
            html: '<h1>' + codeValue + '</h1>'
        })
        //console.log(info);
        if (info.accepted[0] === existingUser.email) {
            const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE);
            existingUser.forgotpasswordCode = hashedCodeValue;
            existingUser.forgotpasswordValidation = Date.now();
            await existingUser.save();
            //console.log(existingUser);
            return res.status(200).json({
                success: true,
                message: "Code Sent!",
            });
        }
        res.status(400).json({
            success: false,
            message: "Code Sent failed!",
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error in Sending Verification Code",
            error
        })
    }
}

exports.verifyForgotPasswordCode = async (req, res) => {
    const { email, providedCode, newPassword } = req.body;
    try {
        const { error, value } = acceptFPCodeSchema.validate({ email, providedCode, newPassword});
        if (error) {
            return res.status(401).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const codeValue = providedCode.toString();
        const existingUser = await Users.findOne({email}).select("+forgotpasswordCode +forgotpasswordValidation");
        if (!existingUser) {
            return res.status(401).json({
                success: false,
                message: "User Does Not Exists!",
            });
        }

        if(!existingUser.forgotpasswordCode || !existingUser.forgotpasswordValidation){
            return res.status(400).json({
                success: false,
                message: "Something is wrong with the code !",
            });
        }
        if(Date.now() - existingUser.forgotpasswordValidation > 5 * 60 * 1000){
            return res.status(400).json({
                success: false,
                message: "Code has been expired !",
            });
        }
        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE)
        if(hashedCodeValue === existingUser.forgotpasswordCode){
            const hashedPassword = await doHash(newPassword,12);
            existingUser.password = hashedPassword;
            existingUser.forgotpasswordCode = undefined;
            existingUser.forgotpasswordCodeValidation = undefined;
            await existingUser.save();
            return res.status(200).json({
                success: true,
                message: "Your password has been reseted !",
            });
        }
        return res.status(400).json({
            success: false,
            message: "Unexpected Occured !",
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error in Verification",
            error
        })
    }
}