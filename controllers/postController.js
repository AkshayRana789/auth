const { createPostSchema } = require('../middlewares/validator');
const Posts = require('../models/postModel');

exports.getPost = async (req, res) => {
    const { page } = req.query;
    const postPerPage = 10;

    try {
        let pageNum = 0;
        if (page <= 1) {
            pageNum = 0
        } else {
            pageNum = page - 1
        }
        const result = await Posts.find()
            .sort({ createdAt: -1 })
            .skip(pageNum * postPerPage)
            .limit(postPerPage)
            .populate({ 
                path: 'userId', 
                select: 'email', 
            });
        res.status(200).json({
            success: true,
            messages: 'All Posts',
            data: result
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            messages: "Error in get posts !",
            error
        })
    }
}

exports.singlePost = async (req, res) => {
    const { _id } = req.query;
    
    try {
        
        const existingPost = await Posts.findOne({_id}).populate({ 
            path: 'userId', 
            select: 'email', 
        });
        
        if(!existingPost){
            return res.status(404).json({
                success: false,
                messages: 'Post unavailable'
            });
        }
        res.status(200).json({
            success: true,
            messages: 'Single Posts',
            data: existingPost
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            messages: "Error in get posts !",
            error
        })
    }
}

exports.createPost = async (req,res) => {
    const {title,description} = req.body;
    const {userId} = req.user;
    try {
        const { error, value } = createPostSchema.validate({ title, description, userId });
        if (error) {
            return res.status(401).json({
                success: false,
                message: error.details[0].message,
            });
        }
        const result = await Posts.create({ title, description, userId });
        res.status(201).json({
            success: true,
            messages: 'posts',
            data: result
        });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            messages: "Error in get posts !",
            error
        });
    }
}

exports.updatePost = async (req,res) => {
    const {_id} = req.query;
    const {title,description} = req.body;
    const {userId} = req.user;
    try {
        const { error, value } = createPostSchema.validate({ title, description, userId });
        if (error) {
            return res.status(401).json({
                success: false,
                message: error.details[0].message,
            });
        }
        const existingPost = await Posts.findOne({_id});
        if(!existingPost){
            return res.status(404).json({
                success: false,
                messages: 'Post unavailable'
            });
        }

        if(existingPost.userId.toString() !== userId){
            return res.status(403).json({
                success: false,
                messages: 'Unauthorized'
            });
        }
        existingPost.title = title;
        existingPost.description = description;
        const result = await existingPost.save();
        res.status(200).json({
            success: true,
            messages: 'Post Updated',
            data: result
        });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            messages: "Error in get posts !",
            error
        });
    }
}

exports.deletePost = async (req,res) => {
    const {_id} = req.query;
    const {userId} = req.user;

    try {
        const existingPost = await Posts.findOne({_id});
        if(!existingPost){
            return res.status(404).json({
                success: false,
                messages: 'Post Not Exists !'
            });
        }

        if(existingPost.userId.toString() !== userId){
            return res.status(403).json({
                success: false,
                messages: 'Unauthorized'
            });
        }
        await Posts.deleteOne({_id});
        res.status(200).json({
            success: true,
            messages: 'Post Deleted..'
        });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            messages: "Error in get posts !",
            error
        });
    }
}