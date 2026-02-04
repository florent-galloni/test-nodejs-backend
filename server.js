import express from 'express'

const app = express()

const DEFAULT_DELAY = 2500
const DEFAULT_PORT = 4321
const MAX_CONCURRENCY = 3

let runningQueries = 0
let queryIndex = 0

function delay(timeout = DEFAULT_DELAY) {
    return new Promise(resolve => setTimeout(resolve, timeout))
}

app.get('/', (_, res) => {
    res
        .status(200)
        .type('application/json')
        .send(JSON.stringify(
            {
                message: "Server is doing its best",
                runningQueries,
                queryIndex
            }))
})

app.get('/data', async (_, res) => {
    queryIndex++
    if (runningQueries > MAX_CONCURRENCY * Math.random()) {
        return res
            .status(429)
            .type('application/json')
            .send(JSON.stringify(
                {
                    message: "Too many concurrent request",
                    runningQueries,
                    queryIndex
                }))
    }
    runningQueries++
    await delay()

    res
        .status(200)
        .type('application/json')
        .send(JSON.stringify(
            {
                message: `query n° : ${queryIndex} succeed`,
                runningQueries,
                queryIndex
            }))
    runningQueries--

})


const args =  process.argv.slice(2);
const port = args[0] ?? DEFAULT_PORT
app.listen(port, () => {
    console.log(`Flaky server is running (flakily) ${port}`)
})