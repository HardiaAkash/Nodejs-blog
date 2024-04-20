const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  files:[{
    type:String
  }],
  publishDate: {
    type: Date,
    default: Date.now
  },
  comments: [{
    text: String,
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    postedAt: {
      type: Date,
      default: Date.now
    }
  }],

}, { timestamps: true });  // Automatically adds createdAt and updatedAt fields

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
