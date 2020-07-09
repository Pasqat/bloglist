const listHelper = require('../utils/list_helper')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')
const User = require('../models/user')
require('dotenv').config()


const api = supertest(app)

test('dummy returns one', () => {
  const blogs = []

  const result = listHelper.dummy(blogs)
  expect(result).toBe(1)
})

beforeEach(async () => {
  await Blog.deleteMany({})


  const blogObjects = helper.initialBlogs
    .map(blog => new Blog(blog))
  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)


})

let token
beforeAll(async (done) => {
  await api
    .post('/api/login')
    .send({
      username: 'root',
      password: 'senzaniente'
    })
    .end((err, response) => {
      token = response.body.token // save the token!
      console.log('Token:', token, 'Body:', response.body)
      done()
    })
})

describe('Total Likes', () => {

  test('of empty list is zero', () => {
    const result = listHelper.totalLikes(helper.emptyBlog)
    expect(result).toBe(0)
  })

  test('When list has only one blog equals the likes of that', () => {
    const result = listHelper.totalLikes(helper.listWithOneBlog)
    expect(result).toBe(5)
  })

  test('of a bigger list is calculated right', () => {
    const result = listHelper.totalLikes(helper.initialBlogs)
    expect(result).toBe(36)
  })
})

describe('Hall of fame', () => {

  test('the most favorited blog is find', () => {
    const mostFavorited =  {
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      likes: 12,
    }

    const result = listHelper.favoriteBlog(helper.initialBlogs)
    expect(result).toEqual(mostFavorited)
  })

  test('the author with most blog is finded and returned with total blogs', () => {
    const bestAuthor = {
      author: 'Robert C. Martin',
      blogs: 3
    }

    const result = listHelper.mostBlog(helper.initialBlogs)

    expect(result).toEqual(bestAuthor)
  })

  test('the author with most likes is finded and returned with total likes', () => {
    const mostLikedAuthor = {
      author: 'Edsger W. Dijkstra',
      likes: 17
    }

    const result = listHelper.mostLikes(helper.initialBlogs)
    expect(result).toEqual(mostLikedAuthor)
  })

})

describe('GET blogs post', () => {
  test('blog are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('blogs has the id property as unique identifier', async () => {
    const response = await api.get('/api/blogs')
    const id = response.body.map(i => i.id)

    expect(id).toBeDefined()
  })
})

describe('POST blog into list', () => {


  test('a blog post is succefully added to the list', async () => {

    const users = await helper.usersInDb()
    const userId = users[0].id

    const newBlog = {
      title: 'Testing the DB',
      author: 'Superuser',
      url: 'https://fullstackopen.com/en/part4/structure_of_backend_application_introduction_to_testing#exercises-4-1-4-2',
      likes: 0,
      userId
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)


    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

    const titles = blogsAtEnd.map(c => c.title)
    expect(titles).toContain('Testing the DB')

  })

  test('likes property default to zero if missing', async () => {
    const users = await helper.usersInDb()
    const userId = users[0].id

    // let loggedInToken = ''
    // await api
    //   .post('/api/login')
    //   .send({
    //     username: 'root',
    //     password: 'senzaniente'
    //   })
    //   .then((res) => loggedInToken = res.body.token)

    const newBlog = {
      title: 'Testing the DB',
      author: 'Superuser',
      url: 'https://fullstackopen.com/en/part4/structure_of_backend_application_introduction_to_testing#exercises-4-1-4-2',
      userId
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    const addedBlog = blogsAtEnd.filter(blog => blog.title === 'Testing the DB')

    expect(addedBlog[0].likes).toBe(0)
  })

  test('right satuts code if title and/or url properties are missing', async () => {
    const users = await helper.usersInDb()
    const userId = users[0].id


    // let loggedInToken = ''
    // await api
    //   .post('/api/login')
    //   .send({
    //     username: 'root',
    //     password: 'senzaniente'
    //   })
    //   .then(res => {
    //     console.log(res.body)
    //     return loggedInToken = res.body.token
    //   })

    let newBlog = {
      author: 'Superuser',
      url: 'https://fullstackopen.com/en/part4/structure_of_backend_application_introduction_to_testing#exercises-4-1-4-2',
      likes: 0,
      userId
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(400)

    newBlog = {
      title: 'Testing the DB',
      author: 'Superuser',
      likes: 0,
      userId
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(400)

  })

})

describe('DELETE blog post', () => {
  test('succeded with status 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    let loggedInToken = ''
    await api
      .post('/api/login')
      .send({
        username: 'root',
        password: 'senzaniente'
      })
      .then((res) => loggedInToken = res.body.token)

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${loggedInToken}`)
      .expect(204)

    const noteAtEnd = await helper.blogsInDb()

    expect(noteAtEnd).toHaveLength(helper.initialBlogs.length - 1)
  })
})

describe('New user', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('secret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'pasqat',
      name: 'Pasquale Matarrese',
      password: 'senzaniente'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fail with proper statuscode if username already exist', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'senzaniente'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`username` to be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })


  test('creation fail with proper statuscode if no username is given', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      name: 'Superuser',
      password: 'senzaniente'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`username` is required')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fail with proper statuscode if username is shorter than 3', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'rt',
      name: 'Superuser',
      password: 'senzaniente'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('at least 3 characters')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fail with proper statuscode if password is shorter than 3', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'sd'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('password missing or too short')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

})

afterAll(() => {
  mongoose.connection.close()
})