const dummy = () => {
  return 1
}

const totalLikes = blogs => {
  const likes = blogs.map(l => l.likes)
  return likes.reduce((acc, like) => acc + like, 0)
}

const favoriteBlog = blogs => {
  const likes = blogs.map(l => l.likes)
  const maxLikes = Math.max.apply(null, likes)
  const filter = blogs.find(blog => blog.likes === maxLikes)

  return {
    title: filter.title,
    author: filter.author,
    likes: filter.likes
  }
}

module.exports = {
  dummy, totalLikes, favoriteBlog
}