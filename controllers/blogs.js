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

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7)
  }

  return null
}

blogsRouter.post('/', async (request, response, next) => {
  const body = request.body
  const token = getTokenFrom(request)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if(!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  console.log(decodedToken)

  const user = await User.findById(decodedToken.id)
  console.log(user)

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

  try {
    await Blog.findByIdAndRemove(request.params.id)
    response.status(204).end()
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