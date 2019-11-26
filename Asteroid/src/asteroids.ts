// FIT2102 2019 Assignment 1
// https://docs.google.com/document/d/1Gr-M6LTU-tfm4yabqZWJYg-zTjEVqHKKTCvePGCYsUA/edit?usp=sharing

function asteroids() {
  // Inside this function you will use the classes and functions 
  // defined in svgelement.ts and observable.ts
  // to add visuals to the svg element in asteroids.html, animate them, and make them interactive.
  // Study and complete the Observable tasks in the week 4 tutorial worksheet first to get ideas.

  // You will be marked on your functional programming style
  // as well as the functionality that you implement.
  // Document your code!  
  // Explain which ideas you have used ideas from the lectures to 
  // create reusable, generic functions.
  const svg = document.getElementById("canvas")!;
  // make a group for the spaceship and a transform to move it and rotate it
  // to animate the spaceship you will update the transform property
  const g = new Elem(svg, 'g')
    .attr("transform", "translate(300 300) rotate(170)").attr("vector_rot", "170")
  const bullet_elems = new Elem(svg, 'g')
  const aster_elems = new Elem(svg, 'g')
  // create a polygon shape for the space ship as a child of the transform group
  const ship = new Elem(svg, 'polygon', g.elem)
    .attr("points", "-15,20 15,20 15,-20 -15,-20")
    //.attr("style", "fill:lime;stroke:purple;stroke-width:1")
    .attr("speed", 0)
    .attr("fill", "url(#spaceship)")
  const ship_radius: number = Math.sqrt(20 * 20 + 15 * 15)
  let ship_movement: { up: boolean, left: boolean, right: boolean, thrust:boolean, firing: boolean } = {
    up: false,
    left: false,
    right: false,
    thrust: false,
    firing: false
  }
  let user_stat = {
    score: 0,
    pause: false,
    lives: 3,
    level: 0
  }
  let asteroids: Elem[] = []

  const asteroid_break_constant: number = 3; // high level asteroid breaks down to "constant" lower level ones
  const keyup = Observable.fromEvent<KeyboardEvent>(document, 'keyup')
  const keydown = Observable.fromEvent<KeyboardEvent>(document, 'keydown')
  const gameTime = Observable.interval(10).filter(() => user_stat.lives > 0 && !user_stat.pause)
  const gamePause = Observable.interval(10).filter(() => user_stat.pause)
  const gameEnd = Observable.interval(10).filter(() => user_stat.lives == 0)
  const max_level: number = 4;
  const in_canvas = (x: number) => (y: number) => x <= 600 && y <= 600 && x >= 0 && y >= 0;
  // function finding the distance between 2 points given their co-ordinates
  const distance
    = (x1: number, y1: number) => (x2: number, y2: number) => Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2))
  // Generate random Int in smaller than a value
  const gen_ran = (max_val: number) => Math.floor(Math.random() * Math.floor(max_val))


  //GAME SETUP

  // Checking if spaceship collide asteroid to pause/end game
  // Side effect to user_stat
  gameTime.subscribe(() => {
    const current_ship = find_trans(g.attr("transform"));
    const aster_no = asteroids.length;
    asteroids
      .map((ele, id) => ({ x: parseFloat(ele.attr("cx")), y: parseFloat(ele.attr("cy")), r: parseFloat(ele.attr("r")), level: parseFloat(ele.attr("level")), velocity: parseFloat(ele.attr("velocity")), id: id }))
      .filter(({ x, y, r, level, velocity, id }) => (spaceship_collision(current_ship.x, current_ship.y, ship_radius, x, y, r)))
      .forEach(({ x, y, r, level, velocity, id }) => {
        if (aster_no == asteroids.length) {
          if (level > 1) {
            // create a for loop using observable to push new low level asteroids
            // new radius = 1/2 current radius
            // velocity = 1.2 * current velocity
            Observable
              .interval(1)
              .takeUntil(Observable.interval(1).filter((i) => (i >= asteroid_break_constant + 1)))
              .subscribe(() => {
                asteroids.push(new Elem(svg, "circle", aster_elems.elem).attr("rot", `${gen_ran(360)}`).attr("cx", x).attr("cy", y).attr("r", r / 2).attr("velocity", 1.2 * velocity).attr("level", level - 1).attr("fill", "url(#sun)"))
              })
          }
          asteroids[id].elem.remove()
          asteroids.splice(id, 1)
          user_stat.lives -= 1;
          user_stat.pause = user_stat.lives > 0 ? true : false
        }
      })
  })

  // Winning
  // Side effect to DOM
  gameTime.filter(() => asteroids.length == 0 && user_stat.level == 4).subscribe(() => {
    document.getElementById("score")!.innerHTML = `You won with score: ${user_stat.score}. Bonus lives: ${user_stat.lives} x 500. Total: ${user_stat.score + 500 * user_stat.lives}`
  })
  // Game temporarily stops/pauses
  // Side effect to user_stat(game pause) state
  gamePause.subscribe(() => {
    document.getElementById("lives")!.innerHTML = `Lives: ${user_stat.lives}`
    const current_ship = find_trans(g.attr("transform"));
    const aster_no = asteroids.length;
    // Waiting until the position is safe then allowing user to play
    user_stat.pause =
      asteroids
        .map((ele, id) => ({ x: parseFloat(ele.attr("cx")), y: parseFloat(ele.attr("cy")), r: parseFloat(ele.attr("r")), level: parseFloat(ele.attr("level")), velocity: parseFloat(ele.attr("velocity")), id: id }))
        .filter(({ x, y, r, level, velocity, id }) => (spaceship_collision(current_ship.x, current_ship.y, ship_radius, x, y, r + 10))) == []
        ? true : false
  })
  // End game (you lose), Thanos wins not you
  // Side effect to DOM Element
  gameEnd.subscribe(() => {
    document.getElementById("lives")!.innerHTML = "You lose the game. Good luck next time :)))"
  })


  // SHIP SPEED, ACCELERATOR AND MOVEMENT
  // Side effect to ship_movement in exchange of smooth and multiple keyboard input taking

  // Observe the keyboard for ship movement, observe key board input to change state of direction
  keydown.filter((listener) => listener.code == "ArrowUp" ? true : false).subscribe((listener) => { ship_movement.up = true }) // state change
  keydown.filter((listener) => listener.code == "ArrowRight" ? true : false)
    .subscribe(() => {
      ship_movement.right = true // state change
    })
  keydown.filter((listener) => listener.code == "ArrowLeft" ? true : false)
    .subscribe(() => {
      ship_movement.left = true // state change
    })
  keydown.filter((listener) => listener.code == "ShiftRight" || listener.code == "ShiftLeft" ? true : false).subscribe((listener) => { ship_movement.thrust = true }) // state change
  keyup.filter((listener) => listener.code == "ArrowUp" ? true : false)
    .subscribe(() => {
      ship_movement.up = false // state change
    })
  keyup.filter((listener) => listener.code == "ArrowRight" ? true : false).subscribe(() => { ship_movement.right = false }) // state change
  keyup.filter((listener) => listener.code == "ArrowLeft" ? true : false).subscribe(() => { ship_movement.left = false }) // state change
  keyup.filter((listener) => listener.code == "ShiftRight" || listener.code == "ShiftLeft" ? true : false).subscribe((listener) => { ship_movement.thrust = false }) // state change

  // This observable will change the speed of ship when arrowup is released. It will take 1 second until the ship finally stop (Accelator = -0.015)
  // Side effect: ship
  gameTime
    .filter(() => parseFloat(ship.attr("speed")) > 0)
    .subscribe(() => {
      // Duplicated code
      ship.attr("speed", parseFloat(ship.attr("speed")) - 0.015)
      const velocity: number = parseFloat(ship.attr("speed"))
      const ship_pos: { x: number, y: number, rot: number } = find_trans(g.attr("transform")); // current ship position
      const next_x: number = ship_pos.x - velocity * Math.sin(ship_pos.rot * Math.PI / 180 + Math.PI),
        next_y: number = ship_pos.y + velocity * Math.cos(ship_pos.rot * Math.PI / 180 + Math.PI);
      (next_x > 600 || next_y > 600 || next_x < 0 || next_y < 0) ?
        // Ship get outside the bounding
        g.attr("transform", ("translate(" + (Math.floor(600 + next_x) % 600) + " " + (Math.floor(600 + next_y) % 600) + ") rotate(" + ship_pos.rot + ")")) :
        // Ship inside bounding
        g.attr("transform", ("translate(" + (next_x) + " " + (next_y) + ") rotate(" + ship_pos.rot + ")"))
    })

  // Apply state  of direction while moving the ship
  // Side effect to g element in DOM, as every time we move attribute of ship element changes
  gameTime
    .filter(() => ship_movement.up)
    .subscribe(() => {
      // Init speed when ship move is 1.5, thrust is 3
      ship_movement.thrust == true ?
      ship.attr("speed", 3) :
      parseFloat(ship.attr("speed")) < 1.5 ?
      ship.attr("speed",1.5) : undefined
      const velocity: number = parseInt(ship.attr("speed"))
      const ship_pos: { x: number, y: number, rot: number } = find_trans(g.attr("transform")); // current ship position
      const next_x: number = ship_pos.x - velocity * Math.sin(ship_pos.rot * Math.PI / 180 + Math.PI),
        next_y: number = ship_pos.y + velocity * Math.cos(ship_pos.rot * Math.PI / 180 + Math.PI),
        next_rot: number = ship_movement.left === ship_movement.right ? ship_pos.rot :
          ship_movement.left == true ? (ship_pos.rot - 5) % 360 : (ship_pos.rot + 5) % 360;
      (next_x > 600 || next_y > 600 || next_x < 0 || next_y < 0) ?
        // Ship get outside the bounding
        g.attr("transform", ("translate(" + (Math.floor(600 + next_x) % 600) + " " + (Math.floor(600 + next_y) % 600) + ") rotate(" + ship_pos.rot + ")")) :
        // Ship inside bounding
        g.attr("transform", ("translate(" + (next_x) + " " + (next_y) + ") rotate(" + next_rot + ")"))
    })
  
  // Apply state of direction while not moving the ship
  // Side effect to DOM element g
  gameTime
    .filter(() => !ship_movement.up)
    .subscribe(() => {
      //Change the direction of the ship only
      const ship_pos: { x: number, y: number, rot: number } = find_trans(g.attr("transform")); // current ship position
      if (ship_movement.right) {
        g.attr("transform", ("translate(" + (ship_pos.x) + " " + (ship_pos.y) + ") rotate(" + ((ship_pos.rot + 1) % 360) + ")"))
      } else if (ship_movement.left) {
        g.attr("transform", ("translate(" + (ship_pos.x) + " " + (ship_pos.y) + ") rotate(" + ((ship_pos.rot - 1) % 360) + ")"))
      }
    })

  // FIRING BULLETS FROM SHIP
  // Side effect to asteroids array and DOM elements 
  // in exchange for when bullet is out of bound/ hit asteroid both of them need to be removed

  keydown.filter((listener) => listener.code == "Space").subscribe(() => { ship_movement.firing = true })
  keyup.filter((listener) => listener.code == "Space").subscribe(() => { ship_movement.firing = false })
  Observable.interval(100)
    .filter(() => ship_movement.firing)
    .subscribe(() => {
      const ship_pos = find_trans(g.attr("transform"))
      const bul: Elem = new Elem(svg, 'circle', bullet_elems.elem).attr("cx", ship_pos.x).attr("cy", ship_pos.y).attr("rot", ship_pos.rot).attr("r", 2).attr("fill", "lime")
      gameTime
        .takeUntil(gameTime.filter(() => !in_canvas(parseFloat(bul.attr("cx")))(parseFloat(bul.attr("cy")))).forEach(() => { bul.elem.remove() }))
        .subscribe(() => {
          const bul_cx = parseFloat(bul.attr("cx")),
            bul_cy = parseFloat(bul.attr("cy")),
            bul_r = parseFloat(bul.attr("r")),
            bul_rot = parseFloat(bul.attr("rot"));
          const next_x: number = bul_cx - 8 * Math.sin(bul_rot * Math.PI / 180 + Math.PI),
            next_y: number = bul_cy + 8 * Math.cos(bul_rot * Math.PI / 180 + Math.PI);
          bul.attr("cx", next_x).attr("cy", next_y)
          const aster_no = asteroids.length;
          // Side effect: Remove collided asteroid from array
          asteroids.map((ele) => {
            const x: number = parseFloat(ele.attr("cx")),
              y: number = parseFloat(ele.attr("cy")),
              r: number = parseFloat(ele.attr("r")),
              velocity: number = parseFloat(ele.attr("velocity")),
              level: number = parseFloat(ele.attr("level"));
            return { aster: ele, aster_x: x, aster_y: y, aster_r: r, velocity: velocity, level: level }
          }).forEach(({ aster, aster_x, aster_y, aster_r, velocity, level }, id) => {
            if (bullet_collision(bul_cx, bul_cy, aster_x, aster_y, aster_r) && asteroids.length == aster_no) {
              user_stat.score += (4 - level) * 100
              update_score() 
              if (level > 1) {
                // create a for loop using observable to push new low level asteroids
                // new radius = 1/2 current radius
                // velocity = 1.2 * current velocity
                Observable
                  .interval(1)
                  .takeUntil(Observable.interval(1).filter((i) => (i >= asteroid_break_constant + 1)))
                  .subscribe(() => {
                    asteroids.push(new Elem(svg, "circle", aster_elems.elem).attr("rot", `${gen_ran(360)}`).attr("cx", aster_x).attr("cy", aster_y).attr("r", aster_r / 2).attr("velocity", 1.2 * velocity).attr("level", level - 1).attr("fill", "url(#sun)"))
                  })
              }
              asteroids[id].elem.remove()
              asteroids.splice(id, 1)
              // teleport bullet out bound to remove
              bul.attr("cx", 1000).attr("cy", 1000)
            }
          })
        })
    })

  // FLYING ASTEROIDS wohoo
  // Side effect: user_stat.level, asteroids array in exchange to implement level feature

  // create asteroids for each level
  gameTime
    .filter(() => user_stat.level < max_level)
    .filter(() => asteroids.length == 0).subscribe(() => {
      // Init level
      user_stat.level++;
      // Print to screen
      document.getElementById("lvl")!.innerHTML = `Level: ${user_stat.level}`
      //Reset position of ship
      g.attr("transform", "translate(300 300) rotate(170)")
      // Using obsaverble to create array of asteroids instead of loop
      const asterOb = Observable.interval(1)
      asterOb
        .takeUntil(asterOb.filter(i => i == 5))
        .subscribe(() => {
          const x = 0, // Asteroid should start from safe position
            y: number = gen_ran(600),
            r: number = 60 * (user_stat.level / 10 + 1), // Asteroids get bigger based on r
            aster_level: number = user_stat.level == 1 ? 1 : user_stat.level == 2 ? 2 : 3,
            normal_velocity: number = user_stat.level == 4 ? 1.2 : 1;
          // Side effect when creat new element and push to array
          asteroids.push(new Elem(svg, "circle", aster_elems.elem).attr("rot", `${gen_ran(360)}`).attr("cx", x).attr("cy", y).attr("r", r).attr("velocity", normal_velocity).attr("level", aster_level).attr("fill", "url(#moon)"))
        })
    })

  // Asteroids motion, will not affect by game pausing/ending
  Observable.interval(10).subscribe(() => {
    asteroids.map((ele) => {
      const x = parseFloat(ele.attr("cx")),
        y = parseFloat(ele.attr("cy")),
        r = parseFloat(ele.attr("r")),
        rot = parseFloat(ele.attr("rot")),
        velocity = parseFloat(ele.attr("velocity"));
      return { ele: ele, x: x, y: y, r: r, rot: rot, velocity: velocity }
    }).forEach(({ ele, x, y, r, rot, velocity }) => {
      const next_x: number = x - velocity * Math.sin(rot * Math.PI / 180 + Math.PI),
        next_y: number = y + velocity * Math.cos(rot * Math.PI / 180 + Math.PI);
      ele.attr("rot", `${rot}`).attr("cx", (next_x + 600) % 600).attr("cy", (next_y + 600) % 600).attr("r", r).attr("velocity", 1)
    })
  })


  // FUNCTION SUPPORT
  /**
   * This function check if a bullet hits the asteroid 
   * @param cx_bullet x co-or of bullet
   * @param cy_bullet y co-or of bullet
   * @param cx_asteroid x co-or of asteroid
   * @param cy_asteroid y co-or of asteroid
   * @param asteroid_r radius of asteroid
   */
  function bullet_collision(cx_bullet: number, cy_bullet: number, cx_asteroid: number, cy_asteroid: number, asteroid_r: number): boolean {
    return distance(cx_asteroid, cy_asteroid)(cx_bullet, cy_bullet) <= asteroid_r
  }

  /**
   * This function check if the space ship collides with a asteroid
   * Using estimation by checking points of polygons, 
   * not a truely correct solution on this problem (which requires a complex formula on line equation to fine intersection... unnecessarily reduce performance)
   * @param ship_x x co-or of ship
   * @param ship_y y co-or of ship
   * @param ship_r radius of ship
   * @param cx_asteroid x co-or of asteroid
   * @param cy_asteroid y co-or of asteroid
   * @param asteroid_r radius of asteroid
   */
  function spaceship_collision(ship_x: number, ship_y: number, ship_r: number, cx_asteroid: number, cy_asteroid: number, asteroid_r: number) {
    return distance(ship_x, ship_y)(cx_asteroid, cy_asteroid) <= asteroid_r + 0.4 * ship_r // Using 0.4 insted of 1 as it looked great when tested collision
  }

  function find_trans(s: string): { x: number, y: number, rot: number } {
    // Finding the transform value from given string
    const trans: string[] = s.replace(/[^\d. -]/g, "").split(" ")
    return { x: parseFloat(trans[0]), y: parseFloat(trans[1]), rot: parseFloat(trans[2]) }
  }
  function update_score() {
    document.getElementById("score")!.innerHTML = `Score: ${user_stat.score}`
  }

}

// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = () => {
    asteroids();
  }




