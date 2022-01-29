var Xray = require('x-ray')
var x = Xray()

x('https://www.gift-gift.jp/nui/toho.html', '.content-inner li', [
  {
    title: '.item-ttl',
    link: 'a@href',
    info: x('a@href',
      x('.u-box-product', {
        images: x('.gallery-top ul.swiper-wrapper li', [
          'img@src'
        ]),
        desc: '.m-txt-detail'
      }))
  }
])
  .write('results.json')


// x('https://www.gift-gift.jp/nui/nui851.html', '.u-box-product', {
//   desc: '.m-txt-detail'
// })



// x('http://google.com', {
//   main: 'title',
//   image: x('#gbar a@href', {title :'title'}) // follow link to google images
// })
// .write('results.json')

