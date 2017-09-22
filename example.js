
const { getProducts, json2csv } = require('./src')

getProducts({
  save: false,
  requirements: {
    price: {
      min: 5,
      max: 100
    },
    reviews: {
      min: 20,
      max: 1000
    }
  },
  filter: ['books']
})
.then(products => {
  console.log(products)
  json2csv(products)
})
