### Setup

```
npm install
npm run example
```

*(See `./example.js` for usage)*

It takes ~1 minute to scrape the first 2 levels of categories.

The main function takes a config object with the following defaults:

```
{
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
  filter: []
}
```
