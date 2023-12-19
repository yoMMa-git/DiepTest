const express = require('express')
const app = express()

// socket.io setup - create a server
const http = require('http')
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 }) // each 2s we check if we had response from client in the last 5 seconds, if not - disconnect him from the server

const port = 3000

app.use(express.static(__dirname))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html') // as soon as we get request from user - send him HTML file with layout
})

const backendPlayers = {} // array for our favourite players :)
const backendProj = {} // array for our projectiles

let projID = 0 // so we can keep track of projectiles

// NOTE: for one player use 'socket' (socket - for local user, io - for every user)

io.on('connection', (socket) => {  // as soon as someone connects...

    io.emit('updatePlayers', backendPlayers) // update players's position (so the new one could see where the enemies are)

    socket.on('shoot', ({ x, y, angle }) => {
        projID++;
        const velocity = { x: Math.cos(angle) * 8, y: Math.sin(angle) * 8 }
        backendProj[projID] = {
            x, y, velocity, playerID: socket.id
        }
    }) // add projectile to main array

    socket.on('initGame', ({ username, width, height }) => {
        backendPlayers[socket.id] = {
            x: Math.round(Math.random() * 1920),
            y: Math.round(Math.random() * 937),
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            seqNumber: 0,
            score: 0,
            username: username
        } 

        backendPlayers[socket.id].canvas = {
            width, height
        }
    })  // set parameters of new player as soon as he enters its name (including startPos)

    socket.on('disconnect', (reason) => {
        console.log(reason)
        delete backendPlayers[socket.id]
        io.emit('updatePlayers', backendPlayers)
    }) // on disconnect we delete player from array and updating players once more

    socket.on('keydown', ({ key, seqNumber }) => {

        if (!backendPlayers[socket.id]) return

        backendPlayers[socket.id].seqNumber = seqNumber
        switch (key) {
            case 'KeyW':
                backendPlayers[socket.id].y -= 5
                break
            case 'KeyA':
                backendPlayers[socket.id].x -= 5
                break
            case 'KeyS':
                backendPlayers[socket.id].y += 5
                break
            case 'KeyD':
                backendPlayers[socket.id].x += 5
                break
        }

        const playerSides = {
            left: backendPlayers[socket.id].x - 20,
            right: backendPlayers[socket.id].x + 20,
            top: backendPlayers[socket.id].y - 20,
            bottom: backendPlayers[socket.id].y + 20
        }

        if (playerSides.left < 0) {
            backendPlayers[socket.id].x = 20
        }

        if (playerSides.right > 1920) {
            backendPlayers[socket.id].x = 1900
        }

        if (playerSides.top < 0) {
            backendPlayers[socket.id].y = 20
        }

        if (playerSides.bottom > 937) {
            backendPlayers[socket.id].y = 917
        }
    }) // moving our player depending on the pressed key (also check the boundaries)
})

setInterval(() => {
    for (const id in backendProj) {
        backendProj[id].x += backendProj[id].velocity.x
        backendProj[id].y += backendProj[id].velocity.y

        const rad = 1.7 * 3.5 // 1.7 - scale, 3.5 - radius

        if (backendProj[id].x - rad >= backendPlayers[backendProj[id].playerID]?.canvas?.width || backendProj[id].x + rad <= 0 || backendProj[id].y - rad >= backendPlayers[backendProj[id].playerID]?.canvas?.height || backendProj[id].y + rad <= 0) {
            delete backendProj[id]
            continue
        }

        for (const playerID in backendPlayers) {
            const backPlayer = backendPlayers[playerID]

            const dist = Math.hypot(backendProj[id].x - backPlayer.x, backendProj[id].y - backPlayer.y)

            if (dist < 5 + 20 && backendProj[id].playerID !== playerID) { // check if projectile isn't ours
                if (backendPlayers[backendProj[id].playerID]) {
                    backendPlayers[backendProj[id].playerID].score++
                }
                delete backendProj[id]
                delete backendPlayers[playerID]
                break
            }

        }
    }
    io.emit('updateProj', backendProj)
    io.emit('updatePlayers', backendPlayers)
}, 15) // every 15ms we update players's position and watch for collisions

server.listen(port, '0.0.0.0', () => {
    console.log(`Game listening on port ${port}`)
})