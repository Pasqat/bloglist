const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')


usersRouter.get('/', async (req, res, next) => {

  try {
    const users = await User
      .find({})
      .populate('blogs', { title:1, author: 1, likes: 1, url: 1 })
    res.json(users)
  } catch (error) {
    next(error)
  }

})

usersRouter.post('/', async (req,res, next) => {
  const body = req.body

  const saltRounds = 10

  if(!body.password || body.password.length < 3) {
    res.status(400).json({ error: 'password missing or too short' })
  }
  const passwordHash = await bcrypt.hash(body.password, saltRounds)

  const user = new User({
    username: body.username,
    name: body.name,
    passwordHash
  })
  try {
    const savedUser = await user.save()
    res.status(201).json(savedUser)
  } catch (error) {
    next(error)
  }

})

usersRouter.delete('/:id', async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

module.exports = usersRouter