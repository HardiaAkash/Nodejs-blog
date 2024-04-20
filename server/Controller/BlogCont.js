const Blog = require("../Model/Blog");
const uploadOnS3 = require("../Utils/awsS3");
const { HttpStatus, StatusMessage } = require("../Utils/systemMsg");

exports.uploadImage = async (req, res, next) => {
  // console.log(req.file);
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Invalid request" });
    }

    let fileName = req.file.originalname;

    let url = await uploadOnS3(req.file.buffer, fileName);
    console.log("URL:", url);
    return res.status(200).json({ status: true, url: url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
exports.addBlogPost = async (req, res) => {
  try {
    const { title, content, files } = req.body;
    const author = req.user._id;

    if (!title || !content || !author) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: StatusMessage.MISSING_DATA });
    }

    // Check for existing blog post with the same title and author to prevent duplicates
    const existingPost = await Blog.findOne({ title, author });
    // console.log(existingPost);
    if (existingPost) {
      return res
        .status(HttpStatus.DUPLICATE_DATA)
        .json({ message: StatusMessage.DUPLICATE_DATA });
    }

    const newBlogPost = new Blog({
      title,
      content,
      author,
      files, // Assuming files are properly handled on the client-side
    });

    const savedBlogPost = await newBlogPost.save();

    res.status(HttpStatus.OK).json({
      message: StatusMessage.OK,
      blogPost: savedBlogPost,
    });
  } catch (error) {
    console.error("Error adding blog post:", error);
    res
      .status(HttpStatus.SERVER_ERROR)
      .json({ message: StatusMessage.SERVER_ERROR });
  }
};

exports.viewAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, title } = req.query;
    const query = {};

    if (title) {
      query.title = { $regex: title, $options: "i" };
    }

    const blogs = await Blog.find(query)
      .sort({ publishDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("author", "name email") // Populating author details
      .populate("comments.postedBy", "name email"); // Populating commenter's details

    const total = await Blog.countDocuments(query);

    res.status(HttpStatus.OK).json({
      message: StatusMessage.OK,
      data: blogs,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error retrieving blog posts:", error);
    res
      .status(HttpStatus.SERVER_ERROR)
      .json({ message: StatusMessage.SERVER_ERROR });
  }
};

exports.viewBlogById = async (req, res) => {
  const { id } = req.params; // Get the blog ID from the request parameters

  try {
    const blogPost = await Blog.findById(id)
      .populate("author", "name email") // Populating author details
      .populate({
        path: "comments.postedBy", // Nested population for comments
        select: "name email", // Selecting specific fields to populate
      });

    if (!blogPost) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: StatusMessage.NOT_FOUND });
    }

    res.status(HttpStatus.OK).json({
      message: StatusMessage.OK,
      data: blogPost,
    });
  } catch (error) {
    console.error("Error retrieving blog post:", error);
    res
      .status(HttpStatus.SERVER_ERROR)
      .json({ message: StatusMessage.SERVER_ERROR });
  }
};
exports.deleteBlogPost = async (req, res) => {
  const { id } = req.params; // Get the blog ID from the request parameters

  try {
    const blogPost = await Blog.findById(id);

    if (!blogPost) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: StatusMessage.NOT_FOUND });
    }

    if (req.user._id.toString() !== blogPost.author.toString()) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: StatusMessage.UNAUTHORIZED_ACCESS });
    }

    await Blog.findByIdAndDelete(id);
    res.status(HttpStatus.OK).json({ message: StatusMessage.USER_DELETED });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    res
      .status(HttpStatus.SERVER_ERROR)
      .json({ message: StatusMessage.SERVER_ERROR });
  }
};

exports.editBlogPost = async (req, res) => {
  const { id } = req.params; // Get the blog ID from the request parameters
  const { title, content, files } = req.body; // Fields that might be edited

  try {
    const blogPost = await Blog.findById(id);

    if (!blogPost) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: StatusMessage.NOT_FOUND });
    }

    if (req.user._id.toString() !== blogPost.author.toString()) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: StatusMessage.UNAUTHORIZED_ACCESS });
    }
    if (title) blogPost.title = title;
    if (content) blogPost.content = content;
    if (files) blogPost.files = files;

    const updatedBlogPost = await blogPost.save();

    res.status(HttpStatus.OK).json({
      message: StatusMessage.USER_UPDATED,
      data: updatedBlogPost,
    });
  } catch (error) {
    console.error("Error updating blog post:", error);
    res
      .status(HttpStatus.SERVER_ERROR)
      .json({ message: StatusMessage.SERVER_ERROR });
  }
};
exports.addCommentToBlogPost = async (req, res) => {
  const { id } = req.params; // Blog post ID from URL parameters
  const { text } = req.body; // Comment text and user ID from request body
  const userId = req.user._id;
  try {
    // First, find the blog post by ID
    const blogPost = await Blog.findById(id);

    if (!blogPost) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: StatusMessage.NOT_FOUND });
    }
    if (userId?.toString() === blogPost.author?.toString()) {
        return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: "Author cannot comment." });
    }
    // Add new comment to the comments array
    const newComment = {
      text: text,
      postedBy: userId,
      postedAt: new Date(), // Optionally, set the date explicitly here
    };

    blogPost.comments.push(newComment);

    // Save the updated blog post
    const updatedBlogPost = await blogPost.save();

    res.status(HttpStatus.OK).json({
      message: StatusMessage.OK,
      data: updatedBlogPost,
    });
  } catch (error) {
    console.error("Error adding comment to blog post:", error);
    res
      .status(HttpStatus.SERVER_ERROR)
      .json({ message: StatusMessage.SERVER_ERROR });
  }
};
