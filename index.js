const variables = require("./util/Config")
const request = require("request-promise")
const fs = require("fs-extra")
const path = require("path")
const { parse, trim } = require("./util/Parser")
const Logger = require("./util/Logger")
let { data, schemas } = variables.folders

const logger = new Logger().getInstance()
const postUrl = trim(variables.postURL)

;(async () => {
  const allContents = []

  try {
    let schemaFiles = await fs.readdir(schemas, "utf-8")
    for (schemaFile of schemaFiles) {
      let attrFile = path.join(schemas, schemaFile)
      let attributes = await fs.readFile(attrFile, "utf-8")
      attributes = attributes.split(/\n/g)

      let [schemaName, schemaExt] = schemaFile.split(".")
      let recordFile = path.join(data, `${schemaName}.txt`)

      let records = await fs.readFile(recordFile, "utf-8")
      records = records.split(/\n/g)

      for (record of records) {
        let recordJson = parse(record, attributes)
        allContents.push(
          await (async () => {
            try {
              res = await request({
                url: postUrl,
                method: "POST",
                json: true,
                body: recordJson
              })
              return res
            } catch (e) {
              return { recordJson, error: e.message }
            }
          })()
        )
      }

      const retry = allContents.filter(result => result.error)
      if (retry.length) {
        console.log(`retry for ${schemaFile} after ${variables.retryTimeout} seconds`)
        allContents.splice(0, allContents.length)
        setTimeout(async () => {
          for (record of retry) {
            const { recordJson } = record
            allContents.push(
              await (async () => {
                try {
                  res = await request({
                    url: postUrl,
                    method: "POST",
                    json: true,
                    body: recordJson
                  })
                  return res
                } catch (e) {
                  return { recordJson, error: e.message }
                }
              })()
            )
          }
          const blocked = allContents.filter(result => result.error)
          if (blocked.length) {
            logger.log(`Post failures - ${JSON.stringify(blocked, null, 2)}`)
          }
        }, variables.retryTimeout * 1000)
      } else {
        logger.log(`success posts: ${JSON.stringify(allContents, null, 2)}`)
      }
    }
  } catch (e) {
    console.error(e.message)
  }
})()
