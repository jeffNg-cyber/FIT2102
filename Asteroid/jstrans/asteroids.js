"use strict";
function asteroids() {
    const svg = document.getElementById("canvas");
    const g = new Elem(svg, 'g')
        .attr("transform", "translate(300 300) rotate(170)").attr("vector_rot", "170");
    const bullet_elems = new Elem(svg, 'g');
    const aster_elems = new Elem(svg, 'g');
    const ship = new Elem(svg, 'polygon', g.elem)
        .attr("points", "-15,20 15,20 15,-20 -15,-20")
        .attr("speed", 0)
        .attr("fill", "url(#spaceship)");
    const ship_radius = Math.sqrt(20 * 20 + 15 * 15);
    let ship_movement = {
        up: false,
        left: false,
        right: false,
        thrust: false,
        firing: false
    };
    let user_stat = {
        score: 0,
        pause: false,
        lives: 3,
        level: 0
    };
    let asteroids = [];
    const asteroid_break_constant = 3;
    const keyup = Observable.fromEvent(document, 'keyup');
    const keydown = Observable.fromEvent(document, 'keydown');
    const gameTime = Observable.interval(10).filter(() => user_stat.lives > 0 && !user_stat.pause);
    const gamePause = Observable.interval(10).filter(() => user_stat.pause);
    const gameEnd = Observable.interval(10).filter(() => user_stat.lives == 0);
    const max_level = 4;
    const in_canvas = (x) => (y) => x <= 600 && y <= 600 && x >= 0 && y >= 0;
    const distance = (x1, y1) => (x2, y2) => Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
    const gen_ran = (max_val) => Math.floor(Math.random() * Math.floor(max_val));
    gameTime.subscribe(() => {
        const current_ship = find_trans(g.attr("transform"));
        const aster_no = asteroids.length;
        asteroids
            .map((ele, id) => ({ x: parseFloat(ele.attr("cx")), y: parseFloat(ele.attr("cy")), r: parseFloat(ele.attr("r")), level: parseFloat(ele.attr("level")), velocity: parseFloat(ele.attr("velocity")), id: id }))
            .filter(({ x, y, r, level, velocity, id }) => (spaceship_collision(current_ship.x, current_ship.y, ship_radius, x, y, r)))
            .forEach(({ x, y, r, level, velocity, id }) => {
            if (aster_no == asteroids.length) {
                if (level > 1) {
                    Observable
                        .interval(1)
                        .takeUntil(Observable.interval(1).filter((i) => (i >= asteroid_break_constant + 1)))
                        .subscribe(() => {
                        asteroids.push(new Elem(svg, "circle", aster_elems.elem).attr("rot", `${gen_ran(360)}`).attr("cx", x).attr("cy", y).attr("r", r / 2).attr("velocity", 1.2 * velocity).attr("level", level - 1).attr("fill", "url(#sun)"));
                    });
                }
                asteroids[id].elem.remove();
                asteroids.splice(id, 1);
                user_stat.lives -= 1;
                user_stat.pause = user_stat.lives > 0 ? true : false;
            }
        });
    });
    gameTime.filter(() => asteroids.length == 0 && user_stat.level == 4).subscribe(() => {
        document.getElementById("score").innerHTML = `You won with score: ${user_stat.score}. Bonus lives: ${user_stat.lives} x 500. Total: ${user_stat.score + 500 * user_stat.lives}`;
    });
    gamePause.subscribe(() => {
        document.getElementById("lives").innerHTML = `Lives: ${user_stat.lives}`;
        const current_ship = find_trans(g.attr("transform"));
        const aster_no = asteroids.length;
        user_stat.pause =
            asteroids
                .map((ele, id) => ({ x: parseFloat(ele.attr("cx")), y: parseFloat(ele.attr("cy")), r: parseFloat(ele.attr("r")), level: parseFloat(ele.attr("level")), velocity: parseFloat(ele.attr("velocity")), id: id }))
                .filter(({ x, y, r, level, velocity, id }) => (spaceship_collision(current_ship.x, current_ship.y, ship_radius, x, y, r + 10))) == []
                ? true : false;
    });
    gameEnd.subscribe(() => {
        document.getElementById("lives").innerHTML = "You lose the game. Good luck next time :)))";
    });
    keydown.filter((listener) => listener.code == "ArrowUp" ? true : false).subscribe((listener) => { ship_movement.up = true; });
    keydown.filter((listener) => listener.code == "ArrowRight" ? true : false)
        .subscribe(() => {
        ship_movement.right = true;
    });
    keydown.filter((listener) => listener.code == "ArrowLeft" ? true : false)
        .subscribe(() => {
        ship_movement.left = true;
    });
    keydown.filter((listener) => listener.code == "ShiftRight" || listener.code == "ShiftLeft" ? true : false).subscribe((listener) => { ship_movement.thrust = true; });
    keyup.filter((listener) => listener.code == "ArrowUp" ? true : false)
        .subscribe(() => {
        ship_movement.up = false;
    });
    keyup.filter((listener) => listener.code == "ArrowRight" ? true : false).subscribe(() => { ship_movement.right = false; });
    keyup.filter((listener) => listener.code == "ArrowLeft" ? true : false).subscribe(() => { ship_movement.left = false; });
    keyup.filter((listener) => listener.code == "ShiftRight" || listener.code == "ShiftLeft" ? true : false).subscribe((listener) => { ship_movement.thrust = false; });
    gameTime
        .filter(() => parseFloat(ship.attr("speed")) > 0)
        .subscribe(() => {
        ship.attr("speed", parseFloat(ship.attr("speed")) - 0.015);
        const velocity = parseFloat(ship.attr("speed"));
        const ship_pos = find_trans(g.attr("transform"));
        const next_x = ship_pos.x - velocity * Math.sin(ship_pos.rot * Math.PI / 180 + Math.PI), next_y = ship_pos.y + velocity * Math.cos(ship_pos.rot * Math.PI / 180 + Math.PI);
        (next_x > 600 || next_y > 600 || next_x < 0 || next_y < 0) ?
            g.attr("transform", ("translate(" + (Math.floor(600 + next_x) % 600) + " " + (Math.floor(600 + next_y) % 600) + ") rotate(" + ship_pos.rot + ")")) :
            g.attr("transform", ("translate(" + (next_x) + " " + (next_y) + ") rotate(" + ship_pos.rot + ")"));
    });
    gameTime
        .filter(() => ship_movement.up)
        .subscribe(() => {
        ship_movement.thrust == true ?
            ship.attr("speed", 3) :
            parseFloat(ship.attr("speed")) < 1.5 ?
                ship.attr("speed", 1.5) : undefined;
        const velocity = parseInt(ship.attr("speed"));
        const ship_pos = find_trans(g.attr("transform"));
        const next_x = ship_pos.x - velocity * Math.sin(ship_pos.rot * Math.PI / 180 + Math.PI), next_y = ship_pos.y + velocity * Math.cos(ship_pos.rot * Math.PI / 180 + Math.PI), next_rot = ship_movement.left === ship_movement.right ? ship_pos.rot :
            ship_movement.left == true ? (ship_pos.rot - 5) % 360 : (ship_pos.rot + 5) % 360;
        (next_x > 600 || next_y > 600 || next_x < 0 || next_y < 0) ?
            g.attr("transform", ("translate(" + (Math.floor(600 + next_x) % 600) + " " + (Math.floor(600 + next_y) % 600) + ") rotate(" + ship_pos.rot + ")")) :
            g.attr("transform", ("translate(" + (next_x) + " " + (next_y) + ") rotate(" + next_rot + ")"));
    });
    gameTime
        .filter(() => !ship_movement.up)
        .subscribe(() => {
        const ship_pos = find_trans(g.attr("transform"));
        if (ship_movement.right) {
            g.attr("transform", ("translate(" + (ship_pos.x) + " " + (ship_pos.y) + ") rotate(" + ((ship_pos.rot + 1) % 360) + ")"));
        }
        else if (ship_movement.left) {
            g.attr("transform", ("translate(" + (ship_pos.x) + " " + (ship_pos.y) + ") rotate(" + ((ship_pos.rot - 1) % 360) + ")"));
        }
    });
    keydown.filter((listener) => listener.code == "Space").subscribe(() => { ship_movement.firing = true; });
    keyup.filter((listener) => listener.code == "Space").subscribe(() => { ship_movement.firing = false; });
    Observable.interval(100)
        .filter(() => ship_movement.firing)
        .subscribe(() => {
        const ship_pos = find_trans(g.attr("transform"));
        const bul = new Elem(svg, 'circle', bullet_elems.elem).attr("cx", ship_pos.x).attr("cy", ship_pos.y).attr("rot", ship_pos.rot).attr("r", 2).attr("fill", "lime");
        gameTime
            .takeUntil(gameTime.filter(() => !in_canvas(parseFloat(bul.attr("cx")))(parseFloat(bul.attr("cy")))).forEach(() => { bul.elem.remove(); }))
            .subscribe(() => {
            const bul_cx = parseFloat(bul.attr("cx")), bul_cy = parseFloat(bul.attr("cy")), bul_r = parseFloat(bul.attr("r")), bul_rot = parseFloat(bul.attr("rot"));
            const next_x = bul_cx - 8 * Math.sin(bul_rot * Math.PI / 180 + Math.PI), next_y = bul_cy + 8 * Math.cos(bul_rot * Math.PI / 180 + Math.PI);
            bul.attr("cx", next_x).attr("cy", next_y);
            const aster_no = asteroids.length;
            asteroids.map((ele) => {
                const x = parseFloat(ele.attr("cx")), y = parseFloat(ele.attr("cy")), r = parseFloat(ele.attr("r")), velocity = parseFloat(ele.attr("velocity")), level = parseFloat(ele.attr("level"));
                return { aster: ele, aster_x: x, aster_y: y, aster_r: r, velocity: velocity, level: level };
            }).forEach(({ aster, aster_x, aster_y, aster_r, velocity, level }, id) => {
                if (bullet_collision(bul_cx, bul_cy, aster_x, aster_y, aster_r) && asteroids.length == aster_no) {
                    user_stat.score += (4 - level) * 100;
                    update_score();
                    if (level > 1) {
                        Observable
                            .interval(1)
                            .takeUntil(Observable.interval(1).filter((i) => (i >= asteroid_break_constant + 1)))
                            .subscribe(() => {
                            asteroids.push(new Elem(svg, "circle", aster_elems.elem).attr("rot", `${gen_ran(360)}`).attr("cx", aster_x).attr("cy", aster_y).attr("r", aster_r / 2).attr("velocity", 1.2 * velocity).attr("level", level - 1).attr("fill", "url(#sun)"));
                        });
                    }
                    asteroids[id].elem.remove();
                    asteroids.splice(id, 1);
                    bul.attr("cx", 1000).attr("cy", 1000);
                }
            });
        });
    });
    gameTime
        .filter(() => user_stat.level < max_level)
        .filter(() => asteroids.length == 0).subscribe(() => {
        user_stat.level++;
        document.getElementById("lvl").innerHTML = `Level: ${user_stat.level}`;
        g.attr("transform", "translate(300 300) rotate(170)");
        const asterOb = Observable.interval(1);
        asterOb
            .takeUntil(asterOb.filter(i => i == 5))
            .subscribe(() => {
            const x = 0, y = gen_ran(600), r = 60 * (user_stat.level / 10 + 1), aster_level = user_stat.level == 1 ? 1 : user_stat.level == 2 ? 2 : 3, normal_velocity = user_stat.level == 4 ? 1.2 : 1;
            asteroids.push(new Elem(svg, "circle", aster_elems.elem).attr("rot", `${gen_ran(360)}`).attr("cx", x).attr("cy", y).attr("r", r).attr("velocity", normal_velocity).attr("level", aster_level).attr("fill", "url(#moon)"));
        });
    });
    Observable.interval(10).subscribe(() => {
        asteroids.map((ele) => {
            const x = parseFloat(ele.attr("cx")), y = parseFloat(ele.attr("cy")), r = parseFloat(ele.attr("r")), rot = parseFloat(ele.attr("rot")), velocity = parseFloat(ele.attr("velocity"));
            return { ele: ele, x: x, y: y, r: r, rot: rot, velocity: velocity };
        }).forEach(({ ele, x, y, r, rot, velocity }) => {
            const next_x = x - velocity * Math.sin(rot * Math.PI / 180 + Math.PI), next_y = y + velocity * Math.cos(rot * Math.PI / 180 + Math.PI);
            ele.attr("rot", `${rot}`).attr("cx", (next_x + 600) % 600).attr("cy", (next_y + 600) % 600).attr("r", r).attr("velocity", 1);
        });
    });
    function bullet_collision(cx_bullet, cy_bullet, cx_asteroid, cy_asteroid, asteroid_r) {
        return distance(cx_asteroid, cy_asteroid)(cx_bullet, cy_bullet) <= asteroid_r;
    }
    function spaceship_collision(ship_x, ship_y, ship_r, cx_asteroid, cy_asteroid, asteroid_r) {
        return distance(ship_x, ship_y)(cx_asteroid, cy_asteroid) <= asteroid_r + 0.4 * ship_r;
    }
    function find_trans(s) {
        const trans = s.replace(/[^\d. -]/g, "").split(" ");
        return { x: parseFloat(trans[0]), y: parseFloat(trans[1]), rot: parseFloat(trans[2]) };
    }
    function update_score() {
        document.getElementById("score").innerHTML = `Score: ${user_stat.score}`;
    }
}
if (typeof window != 'undefined')
    window.onload = () => {
        asteroids();
    };
//# sourceMappingURL=asteroids.js.map