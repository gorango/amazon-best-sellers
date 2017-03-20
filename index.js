const fs = require('fs')
const { getAllProducts, json2csv } = require('./src')

const then = Date.now()
console.log('Starting...')

// get an array of products
getAllProducts().then(products => {
  // convert json response to csv file
  json2csv(products).then((csv) => {
    const now = Date.now()
    console.log(`Finished after ${ (now - then) / 1000 } seconds`)
  })
})

/**
 * If you already saved the json export and just want to work with the data,
 * uncomment the line below to import it from your local file on go
 */

// const products = JSON.parse(fs.readFileSync('./products.json', 'utf8'))
