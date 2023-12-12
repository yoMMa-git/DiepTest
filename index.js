const canvas = document.querySelector('canvas')
const context = canvas.getContext('2d')

canvas.width = innerWidth
canvas.height = innerHeight

const scale = 1.7

class Player {
    constructor(x, y, color) {
        this.x = x
        this.y = y
        //this.radius = radius 
        this.color = color
    }

    draw() {
        context.beginPath()
        context.rect(this.x - (10 * scale), this.y - (10 * scale), 20 * scale, 20 * scale)
        context.fillStyle = this.color
        context.fill()
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }

    draw() {
        context.beginPath()
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        context.fillStyle = this.color
        context.fill()
    }

    update() {
        this.draw()
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    }
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
        console.log(this.x)
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
    }

    update() {
        this.draw()
        // this.x = this.x + this.velocity.x
        // this.y = this.y + this.velocity.y
    }
}

const x = canvas.width / 2;
const y = canvas.height / 2;

const user = new Player(x, y, '#0085a8')

const projArray = []

const shapeArray = []

function animate() {
    requestAnimationFrame(animate)
    context.clearRect(0, 0, canvas.width, canvas.height)
    user.draw()
    projArray.forEach(proj => {
        proj.update()
    })

    shapeArray.forEach(shapes => {
        shapes.update()
    })
}

function spawnShapes() {
    setInterval(() => {
        console.log(canvas.width)
        shapeArray.push(new Shape(Math.random() * canvas.width, Math.random() * canvas.height, Math.floor(Math.random() * (3) + 1), 10 * scale, 'red'))
    }, Math.random() * (10000) + 10000)
}

window.addEventListener('click', (event) => {

    const angle = Math.atan2(event.clientY - (canvas.height / 2), event.clientX - (canvas.width / 2))

    const velocity = { x: Math.cos(angle), y: Math.sin(angle) }

    projArray.push(new Projectile(canvas.width / 2, canvas.height / 2, 3.5 * scale, '#002be1', velocity))
})

animate()
spawnShapes()