// Materials:
// - https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Drawing_graphics
// - https://youtu.be/ZIQQvxSXLhI

const PI = Math.PI;
const ANIMATION_CYCLE = 120;
const MAX_SPEED = PI / ANIMATION_CYCLE;

function setupCircle(circle) {
    circle.radix = 10;
    circle.log = function (n) {
        return Math.log(n) / Math.log(this.radix);
    };
    circle.getValue = function () {
        return Math.pow(this.radix, -(this.rotation / (2 * PI)));
    }
    return circle;
}

var inner = setupCircle({ x: 0, y: 0, radius: 200, tickLength: -20, rotation: 0, frameDistance: -150, radix: 10 });
var outer = setupCircle({ x: 0, y: 0, radius: 200, tickLength: 20, rotation: 0, frameDistance: 50, radix: 10 });

/// log2 of actual scaling 
var zoomLevel = 0;
var animation = { i: 0, steps: 0, pairs: new Array() };

function prepareTicks(circle) {
    var ticks = Array(circle.radix - 1);
    ticks[0] = 0;
    for (let l = 1; l < ticks.length; ++l) {
        ticks[l] = circle.log(l + 1);
    }
    return ticks;
}

function changeLog(animate) {
    var newRadix = outer.radix;
    let bases = [8, 10, 16];
    for (k in bases) {
        if (document.querySelector('#log' + bases[k] + '-button').checked) {
            newRadix = bases[k];
        }
    }

    var oValue = outer.getValue();
    var iValue = inner.getValue();

    outer.radix = inner.radix = newRadix;

    if (animate) {
        drawBoth();
        newAnimation();
        setupAnimation(outer.rotation, -2 * PI * outer.log(oValue), inner.rotation, -2 * PI * inner.log(iValue), ANIMATION_CYCLE);
        requestAnimationFrame(runAnimation);
    } else {
        outer.rotation = -2 * PI * outer.log(oValue);
        inner.rotation = -2 * PI * inner.log(iValue);
    }
}

const edge = 2 * (outer.radius + outer.frameDistance + 10);
const canvas = document.querySelector('#csrCanvas');
const width = canvas.width = edge;
const height = canvas.height = edge;
// const width = canvas.width = window.innerWidth;
//const height = canvas.height = 2 * (outer.radius + outer.frameDistance + 10);

const ctx = canvas.getContext('2d');
const lockBox = document.querySelector('#lock-button');
const resultBox = document.querySelector('#output');
const resultInnerBox = document.querySelector('#output-lower');

function prepareLabels(circle) {
    var labels = Array(circle.radix - 1);
    let rotations = -circle.rotation / (2 * PI);
    let fullRotations = Math.floor(rotations);
    let factor = Math.pow(circle.radix, fullRotations);
    let show = factor < 1 ? -fullRotations : 0;

    for (let l = 0; l < labels.length; ++l) {
        if (circle.radix == 10) {
            labels[l] = ((l + 1) * factor).toFixed(show).toString(circle.radix);
        } else {
            labels[l] = ((l + 1) * factor).toString(circle.radix);
        }
    }
    return labels;
}

function prepareZoomTicks(circle, level = 1) {
    var labels = Array(circle.radix - 1);
    let rotations = -circle.rotation / (2 * PI);
    let fullRotations = Math.floor(rotations);
    let baseFactor = Math.pow(circle.radix, fullRotations);

    let zoomedFactor = baseFactor / Math.pow(circle.radix, level - 1);
    let result = Math.pow(circle.radix, -(circle.rotation / (2 * PI)));
    let from = Math.floor(result / zoomedFactor);

    let smallerFactor = zoomedFactor / circle.radix;
    let show = smallerFactor < 1 ? (-fullRotations + level) : 0;

    let divisions = (level > 2) ? 2 : circle.radix;

    var ticks = Array(divisions - 1);
    var labels = Array(divisions - 1);
    for (let l = 0; l < ticks.length; ++l) {
        ticks[l] = circle.log(from + (l + 1) / divisions);
        if (circle.radix == 10) {
            labels[l] = (from * zoomedFactor + (l + 1) * zoomedFactor / divisions).toFixed(show).toString(circle.radix);
        } else {
            labels[l] = (from * zoomedFactor + (l + 1) * zoomedFactor / divisions).toString(circle.radix);
        }
    }

    return { 'ticks': ticks, 'labels': labels };
}

/**
 * @param {*} ticks Normalized to [0, 1)
 * @param {*} labels Optional text labels, must match ticks
 */
function drawCircleTicks(circle, ticks, tickScale = 1, labels = null) {
    let tickLength = circle.tickLength * tickScale;

    for (let ti in ticks) {
        let t = ticks[ti]
        ctx.save()

        ctx.rotate(2 * PI * t + circle.rotation);
        ctx.translate(0, -circle.radius);

        ctx.beginPath()
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -tickLength);
        ctx.stroke();

        if (labels !== null) {
            var m = ctx.measureText(labels[ti]);

            ctx.translate(- m.width / 2, -tickLength * 3 / 2 + m.fontBoundingBoxDescent);
            ctx.fillText(labels[ti], 0, 0);
        }

        ctx.restore();
    }
}

function drawMoreTicks(circle) {
    ctx.save();
    if (zoomLevel < 1) {
        let z = prepareZoomTicks(circle);
        drawCircleTicks(circle, z.ticks);
    } else {
        for (let zl = 1; zl <= zoomLevel; ++zl) {
            let z = prepareZoomTicks(circle, zl);
            let tickScale = Math.pow(3 / 4, zl);
            ctx.font = Math.round(10 * Math.pow(0.4, zl), 2) + 'px sans-serif';
            ctx.lineWidth = 1 / Math.pow(2, zl);

            if (zl % 2 == 1) {
                drawCircleTicks(circle, z.ticks, tickScale, z.labels);
            } else {
                drawCircleTicks(circle, z.ticks, tickScale,);
            }
        }
    }
    ctx.restore();
}

function drawOuterCircle(circle) {
    // FIXME: here?
    resultBox.value = circle.getValue();

    ctx.save();

    ctx.translate(circle.x, circle.y);

    ctx.beginPath();
    ctx.arc(0, 0, circle.radius + circle.frameDistance, 0, 2 * PI, true);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, circle.radius + circle.frameDistance, 0, 2 * PI, true);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';
    ctx.font = '12px sans-serif';
    drawCircleTicks(circle, prepareTicks(circle), 1, prepareLabels(circle));

    drawMoreTicks(circle);

    // Result guide
    if (zoomLevel >= 0) {
        ctx.lineWidth = 1 / (zoomLevel + 1);
        ctx.beginPath();
        let guideStart = -(circle.radius + circle.frameDistance);
        ctx.moveTo(0, guideStart);
        ctx.lineTo(0, guideStart + (zoomLevel + 1) * circle.tickLength / 2);
        ctx.stroke();
    }

    ctx.restore();
}

function drawInnerCircle(circle) {
    // FIXME: here?
    resultInnerBox.value = circle.getValue();

    ctx.save();

    ctx.translate(circle.x, circle.y);

    ctx.beginPath();
    ctx.arc(0, 0, circle.radius, 0, 2 * PI, true);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(0, 0, circle.radius + circle.frameDistance, 0, 2 * PI, true);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'red';
    ctx.fillStyle = 'red';
    drawCircleTicks(circle, prepareTicks(circle), 1, prepareLabels(circle));
    drawMoreTicks(circle);
    ctx.restore();
}

function drawBoth() {
    ctx.clearRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    drawOuterCircle(outer);
    ctx.fillStyle = 'yellow';
    drawInnerCircle(inner);
}

function init() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(width / 2, outer.radius + outer.frameDistance + 10);
    multiply();
}

var canvasClicked = null;

function getClickFromEvent(ev) {
    let t = ctx.getTransform();
    var xIn = (ev.offsetX * width / canvas.clientWidth - t.e) / t.a;
    var yIn = (ev.offsetY * height / canvas.clientHeight - t.f) / t.d;

    if (ev.type.startsWith('touch')) {
        let touch = ev.changedTouches[0];
        let bb = canvas.getBoundingClientRect();
        xIn = ((touch.clientX - bb.left) * width / canvas.clientWidth - t.e) / t.a;
        yIn = ((touch.clientY - bb.top) * height / canvas.clientHeight - t.f) / t.d;
    }

    let clickedInner = (xIn * xIn + yIn * yIn < Math.pow(inner.radius, 2));
    let clickedOuter = (xIn * xIn + yIn * yIn < Math.pow(outer.radius + outer.frameDistance, 2));
    let clickedPeg = (xIn * xIn + yIn * yIn < Math.pow(inner.radius + inner.frameDistance, 2));

    return { 'inner': clickedInner, 'outer': clickedOuter, 'peg': clickedPeg, 'point': { 'x': xIn, 'y': yIn } };
}

function canvasMouseDown(ev) {
    let p = getClickFromEvent(ev);
    if (p.inner || p.outer) {
        canvasClicked = p;
        canvas.classList.add("active");
        ev.preventDefault();
    }
}

function updateFromEvent(ev) {
    let p = getClickFromEvent(ev);
    if (p.peg) {
        return;
    }

    let angleWas = Math.atan2(canvasClicked.point.y, canvasClicked.point.x);
    let angleIs = Math.atan2(p.point.y, p.point.x);
    let d = angleWas - angleIs;

    canvasClicked.point = p.point;

    if (Math.abs(d) > PI / 4) {
        // Ignore atan2 jumps
        return;
    }

    if (lockBox.checked) {
        inner.rotation -= d;
        outer.rotation -= d;
    } else if (canvasClicked.inner) {
        inner.rotation -= d;
    } else if (canvasClicked.outer) {
        outer.rotation -= d;
    }

    drawBoth();
}

function canvasMouseUpdate(ev) {
    if (canvasClicked === null) {
        return;
    }
    updateFromEvent(ev);
}

function canvasMouseUp(ev) {
    if (canvasClicked === null) {
        return;
    }
    updateFromEvent(ev);
    canvas.classList.remove("active");
    canvasClicked = null;
}

canvas.onmousedown = canvasMouseDown;
canvas.onmousemove = canvasMouseUpdate;
canvas.onmouseup = canvasMouseUp;
canvas.ontouchstart = canvasMouseDown;
canvas.ontouchmove = canvasMouseUpdate;
canvas.ontouchend = canvasMouseUp;

function runAnimation() {
    if (animation.i >= animation.steps) {
        return;
    }
    outer.rotation = animation.pairs[animation.i].outer
    inner.rotation = animation.pairs[animation.i].inner
    drawBoth();

    animation.i++;

    if (animation.i < animation.steps) {
        requestAnimationFrame(runAnimation);
    }
}

function newAnimation() {
    window.cancelAnimationFrame(runAnimation);
    animation = { i: 0, steps: 0, pairs: new Array() };
}

function setupAnimation(oFrom, oTo, iFrom, iTo, minSteps, maxSpeed = 0) {
    let maxRotation = Math.max(Math.abs(oTo - oFrom), Math.abs(iTo - iFrom));
    let maxSpeedSteps = maxSpeed != 0 ? Math.round(maxRotation / maxSpeed) : minSteps;
    let steps = Math.max(minSteps, maxSpeedSteps);
    let outerStep = (oTo - oFrom) / steps;
    let innerStep = (iTo - iFrom) / steps;

    if (outerStep === 0 && innerStep === 0) {
        console.log("Animation step skipped (no movement)");
        return;
    }

    for (let i = 0; i < steps; ++i) {
        animation.pairs[animation.steps + i] = { 'outer': (oFrom + i * outerStep), 'inner': (iFrom + i * innerStep) };
    }
    animation.pairs[animation.steps + steps] = { 'outer': oTo, 'inner': iTo }
    animation.steps += (steps + 1);
}

function resetCircles(animate = false) {
    if (animate) {
        newAnimation();
        setupAnimation(outer.rotation, 0, inner.rotation, 0, ANIMATION_CYCLE);
        requestAnimationFrame(runAnimation);
    } else {
        outer.rotation = 0;
        inner.rotation = 0;
        drawBoth();
    }
}

function multiply(animate = false) {
    let lhs = document.querySelector("#inputForm #lhs");
    let rhs = document.querySelector("#inputForm #rhs");
    let result = document.querySelector("#inputForm #output");

    let lhsValue = Number(lhs.value)
    let rhsValue = Number(rhs.value)

    result.value = (lhsValue * rhsValue);

    if (animate) {
        newAnimation();
        let rotateBoth = -2 * PI * inner.log(rhsValue);
        setupAnimation(outer.rotation, rotateBoth, inner.rotation, rotateBoth, ANIMATION_CYCLE, MAX_SPEED);
        setupAnimation(rotateBoth, rotateBoth - 2 * PI * outer.log(lhsValue), rotateBoth, rotateBoth, ANIMATION_CYCLE, MAX_SPEED);
        requestAnimationFrame(runAnimation);
    } else {
        inner.rotation = -2 * PI * inner.log(rhsValue);
        outer.rotation = inner.rotation + -2 * PI * outer.log(lhsValue);
        drawBoth();
    }
}

function divide(animate = false) {
    let lhs = document.querySelector("#inputForm #lhs");
    let rhs = document.querySelector("#inputForm #rhs");
    let result = document.querySelector("#inputForm #output");

    let lhsValue = Number(lhs.value)
    let rhsValue = Number(rhs.value)

    result.value = (lhsValue / rhsValue);

    if (animate) {
        newAnimation();
        let rotateOuter = -2 * PI * outer.log(lhsValue);
        let rotateInner = -2 * PI * inner.log(rhsValue);
        setupAnimation(outer.rotation, rotateOuter, inner.rotation, rotateInner, ANIMATION_CYCLE, MAX_SPEED);
        setupAnimation(rotateOuter, rotateOuter - rotateInner, rotateInner, 0, ANIMATION_CYCLE, MAX_SPEED);
        requestAnimationFrame(runAnimation);
    } else {
        outer.rotation = -2 * PI * outer.log(lhsValue) + 2 * PI * inner.log(rhsValue);
        inner.rotation = 0;
        drawBoth();
    }
}

function zoomIn() {
    ctx.clearRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    ctx.translate(0, outer.radius + outer.frameDistance - 10);
    ctx.scale(2, 2);
    zoomLevel++;
    drawBoth();
}

function zoomOut() {
    ctx.clearRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    ctx.scale(0.5, 0.5);
    zoomLevel--;
    ctx.translate(0, -(outer.radius + outer.frameDistance - 10));
    drawBoth();
}

window.onload = init;
