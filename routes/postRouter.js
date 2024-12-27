const express = require('express');
const services = require('../controllers/postController');
const { identifier } = require('../middlewares/identification');

const router = express.Router();

router.get('/allPost', services.getPost)
router.get('/singlePost', services.singlePost)
router.post('/createPost', identifier, services.createPost)

router.put('/updatePost', identifier, services.updatePost);
router.delete('/deletePost', identifier, services.deletePost);

module.exports = router;