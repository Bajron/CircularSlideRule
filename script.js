// CSR - cricular slide rule

const canvas = document.querySelector('#csrCanvas');
const width = canvas.width = 1000;
const height = canvas.height = 1000;

const ctx = canvas.getContext('2d');
const PI = Math.PI

function degToRad(degrees) {
    return degrees * PI / 180;
};

var inner = { x: 0, y: 0, radius: 200, tickLength: -20, rotation: 0, frameDistance: -150 };
var outer = { x: 0, y: 0, radius: 200, tickLength: 20, rotation: PI / 4, frameDistance: 50 };

var ticks = Array(9);
ticks[0] = 0;
for (let l = 1; l < ticks.length; ++l) {
    ticks[l] = Math.log10(l + 1);
}
var labels = Array(9);
for (let l = 0; l < labels.length; ++l) {
    labels[l] = (l + 1).toString(10);
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
    ctx.save()

    ctx.translate(circle.x, circle.y)

    ctx.beginPath();
    ctx.arc(0, 0, circle.radius, 0, 2 * PI, true);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, circle.radius + circle.frameDistance, 0, 2 * PI, true);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';
    drawCircleTicks(circle, ticks, labels);

    ctx.restore();
}

function drawInnerCircle(circle) {
    ctx.save()

    ctx.translate(circle.x, circle.y)

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
    drawCircleTicks(circle, ticks, labels);
    ctx.restore();
}

ctx.translate(width / 2, height / 2);
ctx.fillStyle = 'white';
drawOuterCircle(outer);
ctx.fillStyle = 'yellow';
drawInnerCircle(inner);


// Materials:
// - https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Drawing_graphics