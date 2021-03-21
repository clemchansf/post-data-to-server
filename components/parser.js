const trim = str => str.replace(/\s/g, "").replace(/[^\x00-\x7F]/g, "")
const parse = (line, attributes) => {
  /*
    attributes sample: 
    measure_id​,​10​,​TEXT 
    performance_year​,​4​,​INTEGER 
    is_required​,​1​,​BOOLEAN 
    minimum_score​,​2​,​INTEGER

    convert to
    {
      measure_id​,: {width: 10​,​ type:"TEXT"} 
      performance_year​: ​{width: 4,​type: "​INTEGER"} 
      is_required​: ​1 ​​{width: 1,​type: "​BOOLEAN"} 
      minimum_score​: ​{width: 2,​type: "​INTEGER"} 
    {}

  */
  const format = attributes.reduce((obj, attr) => {
    const [name, width, dataType] = trim(attr).split(",")
    obj[name] = {
      width: parseInt(width),
      dataType
    }
    return obj
  }, {})

  const splitPoint = line.search(/\d/)
  const code = trim(line.substr(splitPoint))

  const measure_id = trim(line.substr(0, splitPoint))

  if (measure_id.length > format.measure_id.width) {
    throw Error("measure_id too long error: " + line)
  }
  // extraction
  let performance_year = code.substr(0, format.performance_year.width)

  // TBD check spec
  let is_required = code.substr(format.performance_year.width, format.performance_year.width + format.is_required.width)

  let start = format.performance_year.width + format.is_required.width
  let end = start + format.minimum_score.width
  let minimum_score = code.substr(start, end)

  // conversion
  performance_year = parseInt(trim(performance_year))
  is_required = Boolean(parseInt(is_required))
  minimum_score = parseInt(trim(minimum_score))

  /*

  IA_PCMH ​20171​ 0
  ACI_LVPP ​20170​-1
  CAHPS_1 ​2017010

  convert to

  {
    "measure_id": "IA_PCMH",
    "performance_year": 2017,
    "is_required": true,
    "minimum_score": 0
  }

   */

  return { measure_id, performance_year, is_required, minimum_score }
}

module.exports = { parse, trim }
