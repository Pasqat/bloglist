const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')


usersRouter.get('/', async (req, res, next) => {

  try {
    const users = await User.find({})
    res.json(users)
  } catch (error) {
    next(error)
  }

})

usersRouter.post('/', async (req,res, next) => {
  const body = req.body

  const saltRounds = 10

  if(!body.password || body.password.length < 3) {
    res.status(400).json({ error: 'password missing' })
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

module.exports = usersRouter