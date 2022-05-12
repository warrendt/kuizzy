import events from "events"
import express from "express"
import { createServer } from "http"
import type { Server, Socket } from "socket.io"

const app = express()
const http = createServer(app)
const io: Server = require("socket.io")(http)
const timeUpEvent = new events.EventEmitter()

const questions = [
    {
        text: "What month and year did we launch our Azure DC's ?",
        time: 10,
        answers: [
            "April 1975",
            "February 2017",
            "June 2019",
            "December 2018",
        ],
        correctAnswer: "December 2018",
    },
    {
        text: "Which product allows you to manage resources from in almost any location in a consistent manner?",
        time: 10,
        answers: [
            "Microsoft Defender",
            "Azure Sentinel",
            "Azure Arc",
            "AWS",
        ],
        correctAnswer: "Azure Arc",
    },
    {
        text: "What does AVS stand for ?",
        time: 10,
        answers: [
            "Azure Virtual Services",
            "Azure VMWare Solution",
            "Azure VMWare Service",
            "Azure VMWare Sales",
        ],
        correctAnswer: "Azure VMWare Solution",
    },
    {
        text: "What is the name of the Super User Group Nishan was talking about?",
        time: 10,
        answers: [
            "Amazing Super User Group",
            "African Super User Group",
            "Europe Super User Group",
            "Anglo Super User Group",
        ],
        correctAnswer: "African Super User Group",
    },
    {
        text: "Is Azure Synapse available in South Africa North?",
        time: 10,
        answers: [
            "YES",
            "NO",
        ],
        correctAnswer: "YES",
    },
    {
        text: "What is baked into sweets as a good luck token in Bolivia?",
        time: 10,
        answers: [
            "Pomegranate seeds",
            "Grapes",
            "Almonds",
            "Coins",
        ],
        correctAnswer: "Coins",
    },
    {
        text: "People in Colombia believe that _____ will increase their chances to travel in the new year.",
        time: 10,
        answers: [
            "packing their suitcases by midnight",
            "making a wish on their passports",
            "buying a new suitcase by midnight",
            "running around the block with their suitcases",
        ],
        correctAnswer: "running around the block with their suitcases",
    },
    {
        text: "BONUS Question - Which cryptocurrency completely dumped to 0 this week?",
        time: 10,
        answers: [
            "WAVES",
            "BITCOIN",
            "APE",
            "LUNA",
        ],
        correctAnswer: "LUNA",
    },
]

/**
 * SOCKETID: ["<PLAYERNAME>", POINTS]
 * Example -- 
 * dfwaogruhdslfsdljf: ["Khushraj", 0]
 */
let userPointsMap: Record<string, [string, number]> = {}

io.on("connection", (socket: Socket) => {
    let attempt = ""

    console.log("A user connected")
    socket.emit("connected")
    socket.once("name", (name) => {
        userPointsMap[socket.id] = [name, 0]
        io.emit("name", name)
    })

    socket.once("start", async () => {
        for (const question of questions) {
            await new Promise<void>(async (resolve) => {
                const toSend: {
                    text: string
                    time: number
                    answers: string[]
                    correctAnswer?: string
                } = { ...question }

                setTimeout(() => {
                    timeUpEvent.emit("timeUp", question.correctAnswer)
                    const sortedValues = Object.values(userPointsMap).sort(([, a], [, b]) => b - a)
                    const top5 = sortedValues.slice(0, 5)

                    io.emit("timeUp", top5)

                    socket.once("next", () => {
                        resolve()
                    })
                }, question.time * 1000)

                delete toSend.correctAnswer
                io.emit("question", toSend)
            })
        }
        const sortedValues = Object.values(userPointsMap).sort(([, a], [, b]) => b - a)
        io.emit("gameover", sortedValues)
        process.exit(0)
    })

    socket.on("answer", answer => {
        attempt = answer
    })

    timeUpEvent.on("timeUp", (correctAnswer) => {
        if (attempt) {
            if (attempt === correctAnswer) {
                userPointsMap[socket.id][1]++
                socket.emit("correct")
            } else {
                socket.emit("incorrect")
            }
            attempt = ""
        } else {
            socket.emit("noAnswer")
        }
    })
})

app.use(express.static("public"))
http.listen(8080, () => {
    console.log("listening on *:8080")
})
