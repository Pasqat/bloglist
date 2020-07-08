const listHelper = require('../utils/list_helper')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')

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

})

afterAll(() => {
  mongoose.connection.close()
})