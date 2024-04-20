const express = require("express")
const router = express.Router()
const { addUser, userLogin, userLogout } = require("../Controller/auth");
const { addBlogPost, viewAllBlogs, viewBlogById, deleteBlogPost, editBlogPost, addCommentToBlogPost, uploadImage } = require("../Controller/BlogCont");
const { isAuthJWT } = require("../Utils/jwt");
// const upload = require("../Utils/multer");
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
//user Route
router.route("/add").post(addUser)
router.route("/login").post(userLogin)
router.route("/logout").get(isAuthJWT,userLogout)

//blog route
router.route("/addBlog").post(isAuthJWT,addBlogPost)
router.route("/all").get(viewAllBlogs)
router.route("/single/:id").get(viewBlogById)
router.route("/delete/:id").delete(isAuthJWT, deleteBlogPost)
router.route("/update/:id").put(isAuthJWT,editBlogPost)
router.route("/addcomment/:id").put(isAuthJWT, addCommentToBlogPost)
router.route("/uploadImage").post(isAuthJWT,upload.single('file'), uploadImage)

module.exports = router;