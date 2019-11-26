/*
 * Pi Approximation
 *
 * Open challenge.html in the browser.
 * Fix createDot, and create a subscription for it to the numberPairObservable
 * so that dots are drawn onto the canvas.
 * Make the dots within the circle a different colour
 * to the dots outside the circle.
 */

function piApproximation() {
  const resultInPage = document.getElementById("value_piApproximation");
  if (!resultInPage) {
      console.log("Not on the challenge.html page")
      return;
  }

  const pseudoRandomNum = (seed: number) => (prime1: number, prime2: number) => (v: number) => ((((prime1 * v) + seed) % prime2) - (prime2 / 2)) / (prime2 / 2);
  const randomNum1 = pseudoRandomNum(1)(1262099, 77237);
  const randomNum2 = pseudoRandomNum(1)(1246499, 77237);
  const inCircle = ({x,y}:{x:number,y:number}) => (x * x) + (y * y) <= 1;

  function createDot(x:number, y:number, colour:string) {
      const canvas = document.getElementById("piApproximationVis");
      if(!canvas) throw "Couldn't get canvas element!";
      const dot = document.createElementNS(canvas.namespaceURI, "circle");
      // Set circle properties
      dot.setAttribute("cx", "30");   // Hardcoded x point
      dot.setAttribute("cy", "50");   // Hardcoded y point
      dot.setAttribute("r", "10");
      dot.setAttribute("fill", colour);// All points red

      // Add the dot to the canvas
      canvas.appendChild(dot);
  }

  const numberPairObservable = Observable
      .interval(100)
      .map(v => Math.floor(v/100))                // Turn the timer into a stream of incrementing integers.
      .map(v => ({x:randomNum1(v), y:randomNum2(v)}));   // Create two random numbers, the x and y coordinates
  
  numberPairObservable
      .map(inCircle)                              // Check if the point is inside the circle
      .scan([0, 0], ([i, t], e) => e ? [i+1, t+1] : [i, t+1]) // Tally up points within circle against total points
      .map(([inside, total]) => inside / total)   // points inside / total points
      .map(e => e * 4)                            // multiply by 4 to get to pi
      .subscribe(e => {
          // Update the value of pi on the html page.
          resultInPage.textContent = e.toString();
      });
}

/**
 * an example of traditional event driven programming style - this is what we are 
 * replacing with observable.
 * The following adds a listener for the mouse event
 * handler, sets p and adds or removes a highlight depending on x position
 */
function mousePosEvents() {
  const pos = document.getElementById("pos")!;

  document.addEventListener("mousemove", ({clientX,clientY}) => {
    const p = clientX + ', ' + clientY;
    pos.innerHTML = p;
    if (clientX > 400) {
      pos.classList.add('highlight');
    } else {
      pos.classList.remove('highlight');
    }
  });

  document.addEventListener("mousemove", e => {
    const p = e.clientX + ', ' + e.clientY;
    pos.innerHTML = p;
    if (e.clientX > 400) {
      pos.classList.add('highlight');
    } else {
      pos.classList.remove('highlight');
    }
  });
}

/**
 * constructs an Observable event stream with three branches:
 *   Observable<x,y>
 *    |- set <p>
 *    |- add highlight
 *    |- remove highlight
 */
function mousePosObservable() {
  const 
    pos = document.getElementById("pos")!,
    o = Observable
          .fromEvent<MouseEvent>(document, "mousemove")
          .map(({clientX, clientY})=>({x: clientX, y: clientY}));

  o.map(({x,y}) => `${x},${y}`) // x + ', ' + y
    .subscribe(s => pos.innerHTML = s);

  o.filter(({x}) => x > 400)
    .subscribe(_ => pos.classList.add('highlight'));

  o.filter(({x}) => x <= 400)
    .subscribe(_ => pos.classList.remove('highlight'));
}

/**
 * animates an SVG rectangle, passing a continuation to the built-in HTML5 setInterval function.
 * a rectangle smoothly moves to the right for 1 second.
 */
function animatedRectTimer() {
  const svg = document.getElementById("animatedRect")!;
  let rect = new Elem(svg, 'rect')
    .attr('x', 100).attr('y', 70)
    .attr('width', 120).attr('height', 80)
    .attr('fill', '#95B3D7');
  const animate = setInterval(()=>rect.attr('x', 1+Number(rect.attr('x'))), 10);
  const timer = setInterval(()=>{
    clearInterval(animate);
    clearInterval(timer);
  }, 1000);
}

/**
 * Demonstrates the interval method on Observable.
 * The observable stream fires every 10 milliseconds.
 * It terminates after 1 second (1000 milliseconds)
 */
function animatedRect() {
  const svg = document.getElementById("animatedRect")!;
  let rect = new Elem(svg, 'rect')
    .attr('x', 100).attr('y', 70)
    .attr('width', 120).attr('height', 80)
    .attr('fill', '#95B3D7');

  Observable.interval(10)
    .takeUntil(Observable.interval(1000))
    .subscribe(()=>rect.attr('x', 1+Number(rect.attr('x'))));
}

// an example of traditional event driven programming style - this is what we are 
// replacing with observable
// creates an SVG rectangle that can be dragged with the mouse
function dragRectEvents() {
  const svg = document.getElementById("dragRect")!,
    {left, top} = svg.getBoundingClientRect();
    
  const rect = new Elem(svg, 'rect')
    .attr('x', 100).attr('y', 70)
    .attr('width', 120).attr('height', 80)
    .attr('fill', '#95B3D7');

  rect.elem.addEventListener('mousedown', <EventListener>((e:MouseEvent)=>{
    const 
      xOffset = Number(rect.attr('x')) - e.clientX,
      yOffset = Number(rect.attr('y')) - e.clientY,
      moveListener = (e:MouseEvent)=>{
        rect
          .attr('x',e.clientX + xOffset)
          .attr('y',e.clientY + yOffset);
      },
      done = ()=>{
        svg.removeEventListener('mousemove', moveListener);
      };
    svg.addEventListener('mousemove', moveListener);
    svg.addEventListener('mouseup', done);
    svg.addEventListener('mouseout', done);
  }))
}

/**
 * Observable version of dragRectEvents:
 * Constructs an observable stream for the rectangle that
 * on mousedown creates a new stream to handle drags until mouseup
 *   O<MouseDown>
 *     | map x/y offsets
 *   O<x,y>
 *     | flatMap
 *     +---------------------+------------...
 *   O<MouseMove>          O<MouseMove>
 *     | takeUntil mouseup   |
 *   O<MouseMove>          O<MouseMove>
 *     | map x/y + offsets   |
 *     +---------------------+------------...
 *   O<x,y>
 *     | move the rect
 *    --- 
 */
function dragRectObservable() {
  const 
    svg = document.getElementById("dragRect")!,
    mousemove = Observable.fromEvent<MouseEvent>(svg, 'mousemove'),
    mouseup = Observable.fromEvent<MouseEvent>(svg, 'mouseup'),
    rect = new Elem(svg, 'rect')
            .attr('x', 100)    .attr('y', 70)
            .attr('width', 120).attr('height', 80)
            .attr('fill', '#95B3D7');
  rect.observe<MouseEvent>('mousedown')
    .map(({clientX, clientY}) => ({ xOffset: Number(rect.attr('x')) - clientX,
                                    yOffset: Number(rect.attr('y')) - clientY }))
    .flatMap(({xOffset, yOffset}) =>
      mousemove
        .takeUntil(mouseup)
        .map(({clientX, clientY}) => ({ x: clientX + xOffset, y: clientY + yOffset })))
    .subscribe(({x, y}) =>
      rect.attr('x', x)
          .attr('y', y));
}

/**
 * An example of traditional event driven programming style - this is what we are 
 * replacing with observable.
 * It allows the user to draw SVG rectangles by dragging with the mouse
 */
function drawRectsEvents() {
  const svg = document.getElementById("drawRects")!;

  svg.addEventListener('mousedown', e => {
    const 
      svgRect = svg.getBoundingClientRect(),
      x0 = e.clientX - svgRect.left,
      y0 = e.clientY - svgRect.top,
      rect = new Elem(svg, 'rect')
        .attr('x', String(x0))
        .attr('y', String(y0))
        .attr('width', '5')
        .attr('height', '5')
        .attr('fill', '#95B3D7');

    function moveListener(e: any) {
      const x1 = e.clientX - svgRect.left,
        y1 = e.clientY - svgRect.top,
        left = Math.min(x0, x1),
        top = Math.min(y0, y1),
        width = Math.abs(x0 - x1),
        height = Math.abs(y0 - y1);
        rect.attr('x', String(left))
            .attr('y', String(top))
            .attr('width', String(width))
            .attr('height', String(height));
    }

    function cleanup() {
      svg.removeEventListener('mousemove', moveListener);
      svg.removeEventListener('mouseup', cleanup);
    }

    svg.addEventListener('mouseup', cleanup);
    svg.addEventListener('mousemove', moveListener);
  });
}

/**
 * Observable version of the above
 */

function drawRectsObservable() {
  const 
    svg = document.getElementById("drawRects")!,
    mousemove = Observable.fromEvent<MouseEvent>(svg, 'mousemove'),
    mouseup = Observable.fromEvent<MouseEvent>(svg, 'mouseup'),
    mouseDown = Observable.fromEvent<MouseEvent>(svg, 'mousedown');
  // implement this function!
  mouseDown.map(({clientX,clientY}) => {
    const svg = document.getElementById("drawRects")!;
    const svgRect = svg.getBoundingClientRect(),
    // real co-or of mouse
    x0 = clientX - svgRect.left,
    y0 = clientY - svgRect.top;
    const
      rect = new Elem(svg, 'rect')
        .attr('x', String(x0))
        .attr('y', String(y0))
        .attr('width', '5')
        .attr('height', '5')
        .attr('fill', '#95B3D7');
    const
      init_x = clientX,
      init_y = clientY;
    return ({init_x,init_y,rect})
  })
  .flatMap(({init_x,init_y,rect}) =>
    mousemove
      .takeUntil(mouseup)
      .map(({clientX,clientY}) => ({x:clientX - init_x, y:clientY - init_y,rect}))
  )
  .subscribe(({x,y,rect})=>
    rect.attr('width',x).attr('height',y)
  )
}

/**
 * applied to a mouse event, such as mousedown, this function will prevent the event
 * from propagating down to other underlying elements at the same position of the mouse cursor.
 * @param e an event
 * @returns the event so it can be used in a chain
 */
function stopPropagation<E extends Event>(e:E) {
  e.stopPropagation();
  return e;
}

/**
 * dragging on an empty spot on the canvas should draw a new rectangle.
 * dragging on an existing rectangle should drag its position.
 */
function drawAndDragRectsObservable() {
  // implement this function!
  // A problem to solve is how to drag a rectangle without starting to draw another rectangle?
  // Two possible solutions: 
  //  (1) introduce a "drag state" by mutating a top level variable at mousedown on the rectangle 
  //  (2) add a parallel subscription to mousedown that calls the "stopPropagation" method on the MouseEvent
  // Which one is better and why?
  // See if you can refactor the code from dragRectObservable and drawRectsObservable into reusable functions
  // that can be composed together to make drawAndDragRectsObservable almost trivial.
  let rects:Elem[] = [];
  const 
  svg = document.getElementById("drawAndDragRects")!,
  mousemove = Observable.fromEvent<MouseEvent>(svg, 'mousemove'),
  mouseup = Observable.fromEvent<MouseEvent>(svg, 'mouseup'),
  mouseDown = Observable.fromEvent<MouseEvent>(svg, 'mousedown');
  mouseDown.map(({clientX,clientY}) =>
  {
    if(!exist(clientX,clientY,rects)){  
      const svgRect = svg.getBoundingClientRect(),
      // real co-or of mouse
      x0 = clientX - svgRect.left,
      y0 = clientY - svgRect.top;
      const
        rect = new Elem(svg, 'rect')
          .attr('x', String(x0))
          .attr('y', String(y0))
          .attr('width', '5')
          .attr('height', '5')
          .attr('fill', '#95B3D7');
        rects.push(rect)
      const
        type = "draw",
        init_x = clientX,
        init_y = clientY;
      return ({init_x,init_y,rect,type})
    }else{
      const
      type = "drag",
      rect = findRect(clientX,clientY,rects);
      const
      init_x = Number(rect.attr('x')) - clientX,
      init_y = Number(rect.attr('y')) - clientY;
      return ({init_x,init_y,rect,type})
    }
  })
  .flatMap(({init_x,init_y,rect,type}) =>
    mousemove
      .takeUntil(mouseup)
      .map(({clientX,clientY}) =>
      type=="draw"?
      {x:clientX - init_x, y:clientY - init_y,rect,type}
      :{x:clientX + init_x, y:clientY + init_y,rect,type}
    )
  )
  .subscribe(({x,y,rect,type})=>
  type == "draw" ?
  rect.attr('width',x).attr('height',y)
  :rect.attr('x', x).attr('y', y)
  )


  function exist(x:Number,y:Number,rects:Elem[]):boolean {
    let status = false;
    rects.forEach(element => {
      status = 
      parseInt(element.attr('x')) + parseInt(element.attr('width')) > x
      && parseInt(element.attr('y')) + parseInt(element.attr('height')) > y
      && parseInt(element.attr('x')) < x
      && parseInt(element.attr('y')) < y ?
      true : status;
    });
    return status;
  }
  function findRect(x:Number,y:Number,rects:Elem[]):Elem {
    let status = rects[0];
    rects.forEach(element => {
      status = 
      parseInt(element.attr('x')) + parseInt(element.attr('width')) > x
      && parseInt(element.attr('y')) + parseInt(element.attr('height')) > y
      && parseInt(element.attr('x')) < x
      && parseInt(element.attr('y')) < y ?
      element : status;
    });
    return status;
  }

}


if (typeof window != 'undefined')
  window.onload = ()=>{
    piApproximation();

    // old fashioned continuation spaghetti implementations:
    mousePosEvents();
    animatedRectTimer();
    dragRectEvents();
    //drawRectsEvents();

    // uncomment the following when you are ready to play with Observable:
    // mousePosObservable();
    // animatedRect()
    // dragRectObservable();
    drawRectsObservable();

    // you'll need to implement the following function yourself:
    drawAndDragRectsObservable();
  }