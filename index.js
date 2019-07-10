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
  Devpath: ${ripInfo.devpath}
   Memory: ${ripInfo.memoryusage}
 Use Case: ${ripInfo.usecase}
     Cost: ${ripInfo.cost}
 Delivery: ${ripInfo.delivery}
     Mode: ${ripInfo.mode}
 Requires: ${ripInfo.requirements || 'Basic'} Codin'${(ripInfo.tier == 6 ? ", HOTSIM" : "")}

Functions: ${ripInfo.functions}`
    if (ripInfo.tier == 6) {
        base += `

  Passive: ${ripInfo.passive}

   Active: ${ripInfo.active}

     Once: ${ripInfo.once}`
    }
    if (ripInfo.special) {
        base += `
        
  Special: ${ripInfo.special}`
    }
    return base + "```"
}

function search(criterion, value) {
    let results = []
    if (criterion == 'memoryusage' || criterion == 'tier') {
        results = RIPDATA.filter(el => el[criterion] && el[criterion] === parseInt(value, 10))
    } else {
        results = RIPDATA.filter(el => el[criterion] && el[criterion].includes(value))
    }
    return results.sort((fst, snd) => fst.tier - snd.tier)
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
                case "help":
                    let helpText = `
\`!info <Script name>\` fetches details on a single Script.
\`!search <search-term> <value-to-search>\` fetches a list of Scripts meeting the search terms.
Ex. \`!search tier 4\` returns a list of Scripts that are tier 4.
The following are valid search terms:
\`\`\`
tier 
usecase
title
devpath
delivery
functions
active
passive 
once
requirements
developer
\`\`\``
                    msg.channel.send(helpText)
                    break
                case "info":
                    let scriptName = args.join(' ')
                    let info = RIPDATA.find(el => el.title.includes(scriptName))
                    if (info) {
                        msg.channel.send(prettyPrint(info))
                    } else {
                        msg.channel.send(`No data for ${scriptName}`)
                    }
                    break
                case "search":
                    let criterion = args.shift()
                    let value = args.join(' ')
                    let searchResults = search(criterion, value)
                    if (searchResults.length > 0) {
                        msg.channel.send(`Scripts with **${criterion}** = **${value}:**`)
                        let searchOutput = "```Results:\n\n"
                        for (let i = 0; i < 7; i++) {
                            let ofTier = searchResults.filter(el => el.tier === i)
                            if (ofTier.length > 0) {
                                searchOutput += `Tier ${i}\n----------\n`
                                for (let script of ofTier) {
                                    searchOutput += `${script.title}\n`
                                }
                                searchOutput += '\n'
                            }
                        }
                        searchOutput += "```"
                        msg.channel.send(searchOutput)
                        msg.channel.send('Use `!info <Script name>` to get details on a listed Script.')
                    } else {
                        msg.channel.send(`No Scripts found with **${criterion}** = **${value}**`)
                    }
                    break
            }
        }
    }
})



bot.login(secrets.token)