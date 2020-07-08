const listHelper = require('../utils/list_helper')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')
const User = require('../models/user')

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

describe('POST blog', () => {

  test('a blog post is succefully added to the list', async () => {
    const newBlog = {
      title: 'Testing the DB',
      author: 'Superuser',
      url: 'https://fullstackopen.com/en/part4/structure_of_backend_application_introduction_to_testing#exercises-4-1-4-2',
      likes: 0
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

    const titles = blogsAtEnd.map(c => c.title)
    expect(titles).toContain('Testing the DB')

  })

  test('likes property default to zero if missing', async () => {
    const newBlog = {
      title: 'Testing the DB',
      author: 'Superuser',
      url: 'https://fullstackopen.com/en/part4/structure_of_backend_application_introduction_to_testing#exercises-4-1-4-2',
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    const addedBlog = blogsAtEnd.filter(blog => blog.title === 'Testing the DB')

    expect(addedBlog[0].likes).toBe(0)
  })

  test('right satuts code if title and/or url properties are missing', async () => {
    let newBlog = {
      author: 'Superuser',
      url: 'https://fullstackopen.com/en/part4/structure_of_backend_application_introduction_to_testing#exercises-4-1-4-2',
      likes: 0
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400)

    newBlog = {
      title: 'Testing the DB',
      author: 'Superuser',
      likes: 0
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400)

  })

})

describe('DELETE blog post', () => {
  test('succeded with status 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
    expect(204)

    const noteAtEnd = await helper.blogsInDb()

    expect(noteAtEnd).toHaveLength(helper.initialBlogs.length - 1)
  })
})

describe('Whene there is initialli one user in db', () => {
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

})

afterAll(() => {
  mongoose.connection.close()
})