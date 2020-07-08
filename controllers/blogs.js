const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
require('dotenv').config()

blogsRouter.get('/', async (request, response, next) => {

  try {
    const blogs = await Blog
      .find({})
      .populate('user', { username: 1, name: 1 })
    response.json(blogs)
  } catch (error) {
    next(error)
  }

})


blogsRouter.post('/', async (request, response, next) => {
  const body = request.body

  const decodedToken = jwt.verify(request.token, process.env.SECRET)
  if(!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })

  }

  const user = await User.findById(decodedToken.id)

  const blog = new Blog({
    title: body.title,
    author: body.author,
    likes: body.likes,
    url: body.url,
    user: user._id
  })

  try {
    const blogSaved = await blog.save()
    user.blogs = user.blogs.concat(blogSaved._id)
    await user.save()
    response.status(201).json(blogSaved)
  } catch (error) {
    next(error)
  }

})


blogsRouter.delete('/:id', async (request, response, next) => {
  const blog = await Blog.findById(request.params.id)

  if(!request.token) {
    return response.status(401).json({ error: 'token missing' })
  }

  try {
    const decodedToken = jwt.verify(request.token, process.env.SECRET)

    if(!decodedToken.id) {
      return response.status(401).json({ error: 'token missing or invalid' })
    }
    const userId = await User.findById(decodedToken.id)

    if (blog.user.toString() === userId._id.toString()) {
      await Blog.findByIdAndRemove(request.params.id)
      response.status(204).end()
    } else {
      return response.status(401).json({ error: 'you do not have the rigth permission' })
    }

  } catch (error) {
    next(error)
  }

})

blogsRouter.put('/:id', async (request, response, next) => {
  const body = request.body
  const blog = {
    likes: body.likes
  }

  try {
    const updatedNote = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
    response.json(updatedNote)
  } catch (error) {
    next(error)
  }
})

module.exports = blogsRouter