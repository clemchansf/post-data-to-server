const variables = require("./components/config")
const fs = require("fs")
const { parse, trim } = require("./components/parser")
let { data, schemas } = variables.folders
const Axios = require("axios")

const schemaFiles = fs.readdirSync(schemas)

const log = err => {
  console.log(err)
}

const run = async () => {
  let retry = []
  for (let i = 0; i < schemaFiles.length; i++) {
    let sFile = schemaFiles[i]
    let [sName, sExt] = sFile.split(".")
    if (sExt !== "csv") continue //skip for non schema file

    let sLocation = `${schemas}/${sFile}`
    let attributes = fs.readFileSync(sLocation, "UTF-8").split(/\n/)

    const records = fs.readFileSync(`${data}/${sName}.txt`, "UTF-8").split(/\n/)

    for (let j = 0; j < records.length; j++) {
      let recObj = parse(records[j], attributes)
      try {
        const response = await Axios.post(trim(variables.postURL), recObj)
        log("success post: " + JSON.stringify(response.data, null, 2))
      } catch (status) {
        log("post error: " + status)
        retry.push(recObj)
      } finally {
        //
      }
    }
  }
  return retry
}

const main = async () => {
  try {
    let errors = []
    let redo = await run()

    if (!redo.length) return

    setTimeout(async () => {
      for (let i = 0; i < redo.length; i++) {
        let recObj = redo[i]
        try {
          const response = await Axios.post(trim(variables.postURL), recObj)
          log("post redo succeeded with :" + JSON.stringify(response.data, null, 2))
        } catch (status) {
          log("redo error: " + status)
          errors.push(recObj)
        }
      }
      if (errors.length) {
        log("Real failures: " + JSON.stringify(errors, null, 2))
      }
    }, 5000)
  } catch (status) {
    log("main error: " + status)
  }
}

main()
