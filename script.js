// CSR - cricular slide rule

const canvas = document.querySelector('#csrCanvas');
const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight;

const ctx = canvas.getContext('2d');
const PI = Math.PI

function degToRad(degrees) {
    return degrees * PI / 180;
};

var inner = { x: 0, y: 0, radius: 200, tickLength: -20, rotation: 0, frameDistance: -150 };
var outer = { x: 0, y: 0, radius: 200, tickLength: 20, rotation: 0, frameDistance: 50 };

var animation = { i: 0, steps: 240, pairs: new Array() };

var ticks = Array(9);
ticks[0] = 0;
for (let l = 1; l < ticks.length; ++l) {
    ticks[l] = Math.log10(l + 1);
}
var labels = Array(9);
for (let l = 0; l < labels.length; ++l) {
    labels[l] = (l + 1).toString(10);
}

function prepareLabels(circle) {
    var labels = Array(9);
    let rotations = -circle.rotation / (2 * PI);
    let fullRotations = Math.floor(rotations);
    let factor = Math.pow(10, fullRotations);
    let show = factor < 1 ? -fullRotations : 0;

    for (let l = 0; l < labels.length; ++l) {
        labels[l] = ((l + 1) * factor).toFixed(show).toString(10);
    }
    return labels;
}

/**
 * @param {*} ticks Normalized to [0, 1)
 * @param {*} labels Optional text labels, must match ticks
 */
function drawCircleTicks(circle, ticks, labels = null) {
    for (let ti in ticks) {
        let t = ticks[ti]
        ctx.save()

        ctx.rotate(2 * PI * t + circle.rotation);
        ctx.translate(0, -circle.radius);

        ctx.beginPath()
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -circle.tickLength);
        ctx.stroke();

        if (labels !== null) {
            var m = ctx.measureText(labels[ti]);

            ctx.translate(- m.width / 2, -circle.tickLength * 3 / 2);
            ctx.fillText(labels[ti], 0, 0);
        }

        ctx.restore();
    }
}

function drawOuterCircle(circle) {
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
    drawCircleTicks(circle, ticks, prepareLabels(circle));
    //drawCircleTicks(circle, ticks, labels);

    // Result guide
    ctx.beginPath();
    ctx.moveTo(0, -(circle.radius + circle.frameDistance));
    ctx.lineTo(0, -(circle.radius + circle.frameDistance - circle.tickLength / 2));
    ctx.stroke();

    ctx.restore();
}

function drawInnerCircle(circle) {
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
    drawCircleTicks(circle, ticks, prepareLabels(circle));
    //drawCircleTicks(circle, ticks, labels);
    ctx.restore();
}

function drawBoth() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    drawOuterCircle(outer);
    ctx.fillStyle = 'yellow';
    drawInnerCircle(inner);
}

function init() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(width / 2, height / 2);
    multiply();
}

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

function setupAnimation(oFrom, oTo, iFrom, iTo, steps) {
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
        setupAnimation(outer.rotation, 0, inner.rotation, 0, 120);
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
        let rotateBoth = -2 * PI * Math.log10(rhsValue);
        setupAnimation(outer.rotation, rotateBoth, inner.rotation, rotateBoth, 120);
        setupAnimation(rotateBoth, rotateBoth - 2 * PI * Math.log10(lhsValue), rotateBoth, rotateBoth, 120);
        requestAnimationFrame(runAnimation);
    } else {
        inner.rotation = -2 * PI * Math.log10(rhsValue);
        outer.rotation = inner.rotation + -2 * PI * Math.log10(lhsValue);
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
        let rotateOuter = -2 * PI * Math.log10(lhsValue);
        let rotateInner = -2 * PI * Math.log10(rhsValue);
        setupAnimation(outer.rotation, rotateOuter, inner.rotation, rotateInner, 120);
        setupAnimation(rotateOuter, rotateOuter - rotateInner, rotateInner, 0, 120);
        requestAnimationFrame(runAnimation);
    } else {
        outer.rotation = -2 * PI * Math.log10(lhsValue) + 2 * PI * Math.log10(rhsValue);
        inner.rotation = 0;
        drawBoth();
    }
}

window.onload = init;

// Materials:
// - https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Drawing_graphics