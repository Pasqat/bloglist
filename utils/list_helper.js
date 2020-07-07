const dummy = (blogs) => {
  return 1
}

const totalLikes = blogs => {
  const likes = blogs.map(l => l.likes)
  return likes.reduce((acc, like) => acc + like, 0)
}

module.exports = {
  dummy, totalLikes
}