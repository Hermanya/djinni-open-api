jest.unmock('../data/swagger.json')
const petstore = require('../data/swagger.json')

jest.setMock('../source/get_type.js', jest.fn(_ => _ && 'djinni_type'))

jest.unmock('../source/make_records.js')
const make_records = require('../source/make_records.js')

jest.unmock('fs')
const fs = require('fs')

describe('making records', () => {
  it('should make to records', (done) => {
    fs.readFile('./data/djinni/_records_.djinni', (err, old_records) => {
      if (err) throw err;
      let records = make_records(petstore)
      expect(records).toBe(old_records.toString())
      done()
    })
  })
})
