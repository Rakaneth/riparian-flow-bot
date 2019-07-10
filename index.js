const Discord = require('discord.js')
const MongoClient = require('mongodb').MongoClient
const bot = new Discord.Client()
const secrets = require('./config.json')
let RIPDATA = []

function getRipFlow() {
    return new Promise((resolve, reject) => {
        let uri = `mongodb://${secrets.user}:${secrets.pass}@ds147125.mlab.com:47125/sundry`
        MongoClient.connect(uri, { useNewUrlParser: true }, (err, db) => {
            if (err) {
                reject(err)
            }
            let dbo = db.db('sundry')
            dbo.collection('ate-rip-flow').find({}).toArray((err, result) => {
                if (err) {
                    reject(err)
                }
                resolve(result)
            })
        })
    })
}

function prettyPrint(ripInfo) {
    let base = ` \`\`\`
Name: ${ripInfo.title}
Tier: ${ripInfo.tier}
Memory: ${ripInfo.memoryusage}
Use Case: ${ripInfo.usecase}
Cost: ${ripInfo.cost}
Delivery: ${ripInfo.delivery}
Mode: ${ripInfo.mode}
Requires: ${ripInfo.requirements || 'Basic'} Codin'
Functions: ${ripInfo.functions}`
    if (ripInfo.tier == 6) {
        base += `
Passive: ${ripInfo.passive}
Active: ${ripInfo.active}
Once: ${ripInfo.once}
`
    }
    return base + "```"
}

bot.on('ready', () => {
    getRipFlow()
        .then((result) => {
            RIPDATA = result
        })
        .catch((err) => {
            throw err
        })
})

bot.on('message', msg => {
    let chan = msg.channel
    let cmdRegex = /^!(.*)/
    let cmdParse = cmdRegex.exec(msg.content)
    if (chan.name == 'riparian-flow') {
        if (cmdParse) {
            let args = cmdParse[1].split(/\s+/)
            let cmdName = args.shift()
            switch (cmdName) {
                case "info":
                    let scriptName = args.join(' ')
                    let info = RIPDATA.find(el => el.title.includes(scriptName))
                    if (info) {
                        msg.channel.send(prettyPrint(info))
                    } else {
                        msg.channel.send(`No data for ${scriptName}`)
                    }
                    break
            }
        }
    }
})



bot.login(secrets.token)