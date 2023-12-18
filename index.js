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
canvas.height = innerHeight * devicePixelRatio // setting width and height of canvas (yeah, it's not refreshing with the change of size of window)

const scale = 1.7 // i put everything to simple const which regulates main size of objects
const friction = 0.99 // const for slowing down particles
const speed = 3 // speed of particles

socket.on('updateProj', (backendProj) => {
    for (const id in backendProj) {
        const backProj = backendProj[id]

        if (!frontendProj[id]) {
            frontendProj[id] = new Projectile({x: backProj.x, y: backProj.y, radius: 3.5 * scale, color: frontendPlayers[backProj.playerID]?.color, velocity: backProj.velocity})
        } else {
            frontendProj[id].x += backendProj[id].velocity.x
            frontendProj[id].y += backendProj[id].velocity.y
        }
    }

    for (const id in frontendProj) {
        if (!backendProj[id]) {
            delete frontendProj[id]
        }
    } // deleting projectiles on client side if they're being disconnected
})

socket.on('updatePlayers', (backendPlayers) => { // updating positions of players
    //console.log('called!')
    for (const id in backendPlayers) { // for each passed player from the server (AKA backend)
        const backPlayer = backendPlayers[id]
        //console.log(backPlayer)
        if (!frontendPlayers[id]) { // if ID don't have player, we create new player on the client (AKA frontend)
            frontendPlayers[id] = new Player({x: backPlayer.x, y: backPlayer.y, color: backPlayer.color})
            labels = document.querySelector("#playerLabels").innerHTML += `<div data-id="${id}" data-score="${backPlayer.score}">${backPlayer.username}: ${backPlayer.score}</div>`
            
            //console.log('created!')
        } else {
            document.querySelector(`div[data-id="${id}"]`).innerHTML = `${backPlayer.username}: ${backPlayer.score}`
            document.querySelector(`div[data-id="${id}"]`).setAttribute('data-score', backPlayer.score)
            console.log(backPlayer.username)

            const parentDiv = document.querySelector('#playerLabels')
            const childDivs = Array.from(parentDiv.querySelectorAll('div'))

            childDivs.sort((a, b) => {
                const scoreA = Number(a.getAttribute('data-score'))
                const scoreB = Number(b.getAttribute('data-score'))

                return scoreB - scoreA
            })

            childDivs.forEach((div) => {
                parentDiv.removeChild(div)
            })

            childDivs.forEach((div) => {
                parentDiv.appendChild(div)
            })

            if (id === socket.id) { // if it's client's player
                frontendPlayers[id].x = backPlayer.x 
                frontendPlayers[id].y = backPlayer.y //updating position of our tank
    
                const lastBackInputID = playerInputs.findIndex(input => {
                    return backPlayer.seqNumber === input.seqNumber // getting sequence number
                })
    
                if (lastBackInputID > -1) {
                    playerInputs.splice(0, lastBackInputID + 1) // splicing movements up to sequence number
                }
                
                // TWO FUNCTIONS _ABOVE_ LET US SETTLE SMOOTH MOVEMENT AND SEE ACTUAL POSITION OF PLAYER DESPITE THE EXISTENCE OF PING =)

                playerInputs.forEach(input => {
                    frontendPlayers[id].x += input.dx
                    frontendPlayers[id].y += input.dy // moving the player to current position
                })
            } else { // if we're talking about other players (non-client)
                frontendPlayers[id].x = backPlayer.x
                frontendPlayers[id].y = backPlayer.y //updating positions of players

                gsap.to(frontendPlayers[id], {
                    x: backPlayer.x,
                    y: backPlayer.y,
                    duration: 0.015,
                    ease: 'linear'
                }) // making animation so the movement looks smoother
            }

        }
    }

    for (const id in frontendPlayers) {
        if (!backendPlayers[id]) {
            const divToDel = document.querySelector(`div[data-id="${id}"]`)
            divToDel.parentNode.removeChild(divToDel)
            if (id == socket.id) {
                document.querySelector('#usernameForm').style.display = 'block'
            }
            delete frontendPlayers[id]
        }
    } // deleting players on client side if they're being disconnected
})

class Player {
    constructor({x, y, color}) {
        this.x = x
        this.y = y
        this.color = color
    }

    draw() {
        context.strokeStyle = 'white'
        context.lineWidth = 3
        context.beginPath() // setting the start of the path
        context.rect( this.x - (10 * scale) , this.y - (10 * scale), 20 * scale * window.devicePixelRatio, 20 * scale * window.devicePixelRatio) // drawing a rect
        context.stroke()
        context.fillStyle = this.color // setting a color
        context.fill() // filling drawn rect
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
        context.beginPath() // similar setting of path
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false) // drawing circle
        context.fillStyle = this.color // setting the color
        context.fill() // filling the projectile
    }

    update() {
        this.draw()
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    } // this method change the coordinate of projectile with the flow of time
}


class Shape {
    constructor(x, y, type, size, color) {
        this.x = x
        this.y = y
        this.type = type
        this.size = size // side (rect/triangle) or radius (circle)
        this.color = color
    }

    draw() {
        context.beginPath()
        //console.log(this.x)
        switch (this.type) { //1 - square, 2 - triangle, 3 - circle
            case 1:
                context.rect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size)
                context.fillStyle = this.color
                context.fill()
                break
            case 2:
                context.moveTo(this.x - this.size / 2, this.y + this.size / (2 * Math.sqrt(3)))
                context.lineTo(this.x, this.y - this.size / Math.sqrt(3))
                context.lineTo(this.x + this.size / 2, this.y + this.size / (2 * Math.sqrt(3)))
                context.fillStyle = this.color
                context.fill()
                break
            case 3:
                context.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2, false)
                context.fillStyle = this.color
                context.fill()
                break
        }
    } // depending on type, draws object on the map

    update() {
        this.draw()
        // TODO: 'animate' shapes so the game looks more dynamic
        // this.x = this.x + this.velocity.x
        // this.y = this.y + this.velocity.y
    }
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

const x = canvas.width / 2;
const y = canvas.height / 2; // the player is in the middle of screen

let animID // var, but can't be used outside the box (in our situation - outside of the code)

function animate() {
    animID = requestAnimationFrame(animate) // recursion function, ending when player dies

    context.fillStyle = 'rgba(0, 0, 0, 0.1)' // 0.1 in alpha argument makes this dynamic trail effect

    context.fillRect(0, 0, canvas.width, canvas.height) // clearing screen

    for (const id in frontendPlayers) {
        const player = frontendPlayers[id]
        player.draw()
    }

    for (const id in frontendProj) {
        const project = frontendProj[id]
        project.draw()
    }
}

animate()

window.addEventListener('click', (event) => {

    const playerPos = {
        x: frontendPlayers[socket.id].x,
        y: frontendPlayers[socket.id].y
    }

    const angle = Math.atan2((event.clientY * window.devicePixelRatio) - (playerPos.y), (event.clientX * window.devicePixelRatio) - (playerPos.x))

    socket.emit('shoot', {
        x: playerPos.x,
        y: playerPos.y,
        angle
    })
})

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
})