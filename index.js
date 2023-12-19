const canvas = document.querySelector('canvas') // defining canvas and context of 2d game, which unlocks
const context = canvas.getContext('2d') // vast variety of methods we can use (for example, drawRect or constants like innerWidth)
const devicePixelRatio = window.devicePixelRatio || 1

const socket = io()
const frontendPlayers = {}
const frontendProj = {}

const score = document.querySelector('#counter')
const shapeScore = 100
const enemyScore = 500

canvas.width = innerWidth * devicePixelRatio
canvas.height = innerHeight * devicePixelRatio // setting width and height of canvas

const scale = 1.7 // main size of objects
const friction = 0.99 // const for slowing down particles
const speed = 3 // start speed of particles

socket.on('updateProj', (backendProj) => {
    for (const id in backendProj) {
        const backProj = backendProj[id]

        if (!frontendProj[id]) {
            frontendProj[id] = new Projectile({x: backProj.x, y: backProj.y, radius: 3.5 * scale, color: frontendPlayers[backProj.playerID]?.color, velocity: backProj.velocity})
        } else {
            frontendProj[id].x += backendProj[id].velocity.x
            frontendProj[id].y += backendProj[id].velocity.y
        }
    } // move projectiles

    for (const id in frontendProj) {
        if (!backendProj[id]) {
            delete frontendProj[id]
        }
    } // delete projectiles on client side if they've been disconnected
})

socket.on('updatePlayers', (backendPlayers) => { // updating positions of players
    for (const id in backendPlayers) {

        const backPlayer = backendPlayers[id]

        if (!frontendPlayers[id]) { // if ID don't have player, we create new player on the client (AKA frontend)
            frontendPlayers[id] = new Player({x: backPlayer.x, y: backPlayer.y, color: backPlayer.color, username: backPlayer.username})
            labels = document.querySelector("#playerLabels").innerHTML += `<div data-id="${id}" data-score="${backPlayer.score}">${backPlayer.username}: ${backPlayer.score}</div>`
        } else {

            document.querySelector(`div[data-id="${id}"]`).innerHTML = `${backPlayer.username}: ${backPlayer.score}`
            document.querySelector(`div[data-id="${id}"]`).setAttribute('data-score', backPlayer.score) 

            const parentDiv = document.querySelector('#playerLabels')
            const childDivs = Array.from(parentDiv.querySelectorAll('div')) // create leaderboard with array of usernames

            childDivs.sort((a, b) => {
                const scoreA = Number(a.getAttribute('data-score'))
                const scoreB = Number(b.getAttribute('data-score'))

                return scoreB - scoreA
            }) // sort leaderboard

            childDivs.forEach((div) => {
                parentDiv.removeChild(div)
            })

            childDivs.forEach((div) => {
                parentDiv.appendChild(div)
            })  // update leaderboard

            if (id === socket.id) { // if it's client's player
                frontendPlayers[id].x = backPlayer.x 
                frontendPlayers[id].y = backPlayer.y //update position of player
    
                const lastBackInputID = playerInputs.findIndex(input => {
                    return backPlayer.seqNumber === input.seqNumber // get seqNumber
                })
    
                if (lastBackInputID > -1) {
                    playerInputs.splice(0, lastBackInputID + 1) // splicing movements up to sequence number
                }
                
                // TWO FUNCTIONS _ABOVE_ LET US SETTLE SMOOTH MOVEMENT AND SEE ACTUAL POSITION OF PLAYER DESPITE THE EXISTENCE OF PING =)

                playerInputs.forEach(input => {
                    frontendPlayers[id].x += input.dx
                    frontendPlayers[id].y += input.dy // moving the player to current position
                })
            } else { // if we talk about other players (non-client)
                frontendPlayers[id].x = backPlayer.x
                frontendPlayers[id].y = backPlayer.y //update positions of players

                gsap.to(frontendPlayers[id], {
                    x: backPlayer.x,
                    y: backPlayer.y,
                    duration: 0.015,
                    ease: 'linear'
                }) // make animation so the movement looks smoother
            }

        }
    }

    for (const id in frontendPlayers) { // for every player
        if (!backendPlayers[id]) {
            const divToDel = document.querySelector(`div[data-id="${id}"]`)
            divToDel.parentNode.removeChild(divToDel)
            if (id == socket.id) {
                document.querySelector('#usernameForm').style.display = 'block'
            }
            delete frontendPlayers[id]
        }
    } // delete players on client side if they've been disconnected
})

class Player {
    constructor({x, y, color, username}) {
        this.x = x
        this.y = y
        this.color = color
        this.username = username
    }

    draw() {
        context.font = '12px monospace'
        context.fillStyle = 'white'
        const textWidth = context.measureText(this.username).width
        context.fillText(this.username, this.x - textWidth / 2, this.y+35)
        context.save()
        context.shadowColor = this.color
        context.shadowBlur = 15
        context.strokeStyle = 'white'
        context.lineWidth = 3
        context.beginPath() // setting the start of the path
        context.rect( this.x - (10 * scale) , this.y - (10 * scale), 20 * scale * window.devicePixelRatio, 20 * scale * window.devicePixelRatio) // drawing a rect
        context.stroke()
        context.fillStyle = this.color // setting a color
        context.fill() // filling drawn rect
        context.restore()
    }
}

class Projectile {
    constructor({x, y, radius, color = 'white', velocity}) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity // speed of the projectile
    }

    draw() {
        context.save()
        context.shadowColor = this.color
        context.shadowBlur = 10
        context.beginPath() // similar setting of path
        context.strokeStyle = 'white'
        context.lineWidth = 3
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false) // drawing circle
        context.stroke()
        context.fillStyle = this.color // setting the color
        context.fill() // filling the projectile
        context.restore()
    }

    update() {
        this.draw()
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    } // this method change the coordinate of projectile with the flow of time
}

class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity // speed of the particle
        this.alpha = 1 // particles gonna fade away with the flow of time
    }

    draw() {
        context.save()
        context.globalAlpha = this.alpha
        context.beginPath() // similar setting of path
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false) // drawing circle
        context.fillStyle = this.color // setting the color
        context.fill() // filling the particle
        context.restore()
    }

    update() {
        this.draw()
        this.velocity.x *= friction
        this.velocity.y *= friction
        this.x = this.x + (this.velocity.x)
        this.y = this.y + (this.velocity.y)
        this.alpha -= 0.01
    } // this method change the coordinate of particle with the flow of time
}

let animID
function animate() {
    animID = requestAnimationFrame(animate) // recursion function, ends when player die

    context.clearRect(0, 0, canvas.width, canvas.height)

    for (const id in frontendPlayers) {
        const player = frontendPlayers[id]
        player.draw()
    }

    for (const id in frontendProj) {
        const project = frontendProj[id]
        project.draw()
    }
} // draw players and projectiles

animate()

let shooting
let angle
['mousedown', 'mouseup'].forEach((type) => {
    if (type === 'mousedown') {
		window.addEventListener(type, (event) => {
            window.addEventListener('mousemove', (event2) => {
                angle = Math.atan2((event2.clientY * window.devicePixelRatio) - (frontendPlayers[socket.id].y), (event2.clientX * window.devicePixelRatio) - (frontendPlayers[socket.id].x))
            })

            shooting = setInterval(() => {
                const playerPos = {
                    x: frontendPlayers[socket.id].x,
                    y: frontendPlayers[socket.id].y
                }
            
                socket.emit('shoot', {
                    x: playerPos.x,
                    y: playerPos.y,
                    angle
                })
            }, 250)
        });
	}
    else if (type === 'mouseup') {
        window.addEventListener(type, () => {
            clearInterval(shooting)
        });
    }
}) // player shoots when mouse is being pressed


const keys = {
    w: {pressed: false},
    a: {pressed: false},
    s: {pressed: false},
    d: {pressed: false}
} // just the keys for sequence of pressing keys

const playerInputs = []
let seqNumber = 0

setInterval(() => {
    if (keys.w.pressed) {
        seqNumber++
        playerInputs.push({seqNumber, dx: 0, dy: -5 })
        frontendPlayers[socket.id].y -= 5
        socket.emit('keydown', {key: 'KeyW', seqNumber})
    }
    if (keys.a.pressed) {
        seqNumber++
        playerInputs.push({seqNumber, dx: -5, dy: 0})
        frontendPlayers[socket.id].x -= 5
        socket.emit('keydown', {key: 'KeyA', seqNumber})
    }
    if (keys.s.pressed) {
        seqNumber++
        playerInputs.push({seqNumber, dx: 0, dy: 5})
        frontendPlayers[socket.id].y += 5
        socket.emit('keydown', {key: 'KeyS', seqNumber})
    }
    if (keys.d.pressed) {
        seqNumber++
        playerInputs.push({seqNumber, dx: 5, dy: 0})
        frontendPlayers[socket.id].x += 5
        socket.emit('keydown', {key: 'KeyD', seqNumber})
    }
}, 15) // each 15ms we're checking if we pressed key and writing it into sequence array

window.addEventListener('keydown', (event) => {
    if (!frontendPlayers[socket.id]) return
    
    switch (event.code) {
        case 'KeyW':
            keys.w.pressed = true
            break
        case 'KeyA':
            keys.a.pressed = true
            break
        case 'KeyS':
            keys.s.pressed = true
            break
        case 'KeyD':
            keys.d.pressed = true
            break
    }
}) //listeners for pressing key

window.addEventListener('keyup', (event) => {
    if (!frontendPlayers[socket.id]) return
    
    switch (event.code) {
        case 'KeyW':
            keys.w.pressed = false
            break
        case 'KeyA':
            keys.a.pressed = false
            break
        case 'KeyS':
            keys.s.pressed = false
            break
        case 'KeyD':
            keys.d.pressed = false
            break
    }
}) //listeners for lifing up the key

document.querySelector('#usernameForm').addEventListener('submit', (event) => {
    event.preventDefault()
    document.querySelector('#usernameForm').style.display = 'none'
    socket.emit('initGame', {username: document.querySelector('#usernameInput').value, width: canvas.width, height: canvas.height, devicePixelRatio})
}) // when player inputs username, game starts for him