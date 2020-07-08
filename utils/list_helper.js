const _ = require('lodash')

const dummy = () => {
  return 1
}

const totalLikes = (blogs) => {
  const likes = blogs.map((l) => l.likes)
  return likes.reduce((acc, like) => acc + like, 0)
}

const favoriteBlog = (blogs) => {
  const likes = blogs.map((l) => l.likes)
  const maxLikes = Math.max.apply(null, likes)
  const filter = blogs.find((blog) => blog.likes === maxLikes)

  return {
    title: filter.title,
    author: filter.author,
    likes: filter.likes,
  }
}

const mostBlog = (blogs) => {
  const authors = _.countBy(blogs, (blog) => blog.author)
  const maxKey = _.max(Object.keys(authors), (o) => authors[o])

  return { author: maxKey, blogs: authors[maxKey] }
}

const mostLikes = (blogs) => {
  const unique = _.sortedUniq(blogs.map(a => a.author))

  const sum = unique.map(a => {
    let likes = 0
    blogs.forEach(b => {
      if (b.author === a) {
        likes = likes + b.likes
      }
    })

    return {
      author: a,
      likes: likes
    }
  })

  let mostLikes = 0
  let best = ''
  sum.forEach(c => {
    if (c.likes > mostLikes) {
      mostLikes = c.likes
      best = c.author
    }
  })

  return {
    author: best,
    likes: mostLikes
  }

}


module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlog,
  mostLikes,
}
