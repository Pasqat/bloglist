const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response, next) => {

  try {
    const blogs = await Blog.find({})
    response.json(blogs)
  } catch (error) {
    next(error)
  }

})

blogsRouter.post('/', async (request, response, next) => {
  const blog = new Blog(request.body)

  try {
    const blogSaved = await blog.save()
    response.status(201).json(blogSaved)
  } catch (error) {
    next(error)
  }

})


blogsRouter.delete('/:id', async (request, response, next) => {

  try {
    console.log(request.params.id)
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