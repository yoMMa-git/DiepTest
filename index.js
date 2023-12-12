const canvas = document.querySelector('canvas') // defining canvas and context of 2d game, which unlocks
const context = canvas.getContext('2d') // vast variety of methods we can use (for example, drawRect or constants like innerWidth)

canvas.width = innerWidth
canvas.height = innerHeight // setting width and height of canvas (yeah, it's not refreshing with the change of size of window)

const scale = 1.7 // i put everything to simple const which regulates main size of objects

class Player {
    constructor(x, y, color) {
        this.x = x
        this.y = y
        this.color = color
    }

    draw() {
        context.beginPath() // setting the start of the path
        context.rect(this.x - (10 * scale), this.y - (10 * scale), 20 * scale, 20 * scale) // drawing a rect
        context.fillStyle = this.color // setting a color
        context.fill() // filling drawn rect
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
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
        this.x = this.x + (this.velocity.x)
        this.y = this.y + (this.velocity.y)
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
    } // depending on type, draws object on the map

    update() {
        this.draw()
        // TODO: 'animate' shapes so the game looks more dynamic
        // this.x = this.x + this.velocity.x
        // this.y = this.y + this.velocity.y
    }
}

const x = canvas.width / 2;
const y = canvas.height / 2; // the player is in the middle of screen

const user = new Player(x, y, '#0085a8') // creation of player

const projArray = []

const shapeArray = []

let animID // var, but can't be used outside the box (in our situation - outside of the code)

function animate() {
    animID = requestAnimationFrame(animate) // recursion function, ending when player dies

    context.clearRect(0, 0, canvas.width, canvas.height) // clearing screen

    user.draw() // drawing of user

    projArray.forEach((proj, projID) => {
        proj.update() // next step in projectile's way

        if (proj.x + proj.radius < 0 || proj.x - proj.radius > canvas.width || proj.y + proj.radius < 0 || proj.y - proj.radius > canvas.height) {
            setTimeout(() => {
                projArray.splice(projID, 1) // checking if the projectile is out of screen and if so, delete it
            }, 0)
        }

    }) // drawing projectiles

    shapeArray.forEach((shapes, index) => {
        shapes.update()

        const brack = Math.hypot(user.x - shapes.x, user.y - shapes.y) //TODO: ???

        if (brack - 10 - shapes.size < 1) { // 10 - size of the player
            console.log('go') //TODO: minus the health when support added instead of ending the game
            cancelAnimationFrame(animID) // currently, if we break into obstacle - game freezes
        }

        projArray.forEach((proj, projIndex) => {

            const dist = Math.hypot(proj.x - shapes.x, proj.y - shapes.y) //TODO: make calculations more accurate

            if (dist - shapes.size - proj.radius < 1) { //basically, it calculates the difference between obj and if they're close enough - removing them from screen

                setTimeout(() => {
                    shapeArray.splice(index, 1)
                    projArray.splice(projIndex, 1)
                }, 0);

                console.log('remove from screen')
            }
        });
    }) // drawing shapes


}

function spawnShapes() {
    setInterval(() => {
        //console.log(canvas.width)
        shapeArray.push(new Shape(Math.random() * canvas.width, Math.random() * canvas.height, Math.floor(Math.random() * (3) + 1), (Math.random() * (30) + 10) * scale, 'red'))
    }, Math.random() * (10000) + 10000) // setting spawn event in random time between 10 and 20 seconds
}

window.addEventListener('click', (event) => {

    //console.log(projArray)

    const angle = Math.atan2(event.clientY - (canvas.height / 2), event.clientX - (canvas.width / 2))

    const velocity = { x: Math.cos(angle), y: Math.sin(angle) }

    projArray.push(new Projectile(canvas.width / 2, canvas.height / 2, 3.5 * scale, '#002be1', velocity))
})

animate()
spawnShapes()