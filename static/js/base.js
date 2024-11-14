let circles = [];
let pairs = [];
let coordinates = [];
let topLeft, topRight, bottomLeft, bottomRight, img; // Declare variables

window.onload = function() {
    const img = document.getElementById('to-detect');
    const rect = img.getBoundingClientRect();

    // Top-left corner coordinates
    topLeft = {
        x: rect.left,
        y: rect.top
    };

    // Bottom-right corner coordinates
    bottomRight = {
        x: rect.right,
        y: rect.bottom
    };

    // Calculate topRight and bottomLeft
    topRight = {
        x: rect.right,
        y: rect.top
    };

    bottomLeft = {
        x: rect.left,
        y: rect.bottom
    };
};

document.addEventListener('click', function(event) {
    // Check if a circle was clicked
    const clickedCircle = event.target.closest('.circle');
    if (clickedCircle) {
        // If a circle is clicked, remove it and its pair if it exists
        const pairIndex = pairs.findIndex(pair => pair.includes(clickedCircle));
        if (pairIndex !== -1) {
            const [circle1, circle2] = pairs[pairIndex];
            circle1.remove();
            circle2.remove();
            pairs.splice(pairIndex, 1);
            removeRectangle(circle1, circle2);
        } else {
            clickedCircle.remove();
        }
        return;
    }

    // Create a new circle
    if (event.pageX < topLeft.x || event.pageX > topRight.x || event.pageY < topLeft.y || event.pageY > bottomLeft.y) {
        return;
    }
    const circle = document.createElement('div');
    circle.className = 'circle';
    circle.style.left = `${event.pageX - 10}px`; // Center the circle
    circle.style.top = `${event.pageY - 10}px`;
    document.body.appendChild(circle);
    circles.push(circle);

    // Check if there's a pair
    if (circles.length % 2 === 0) {
        const firstCircle = circles[circles.length - 2];
        const secondCircle = circles[circles.length - 1];
        pairs.push([firstCircle, secondCircle]);
        drawRectangle(firstCircle, secondCircle);
    }
});

function drawRectangle(circle1, circle2) {
    const rect = document.createElement('div');
    rect.className = 'rectangle';

    const x1 = parseInt(circle1.style.left) + 10; // Center of the first circle
    const y1 = parseInt(circle1.style.top) + 10; // Center of the first circle
    const x2 = parseInt(circle2.style.left) + 10; // Center of the second circle
    const y2 = parseInt(circle2.style.top) + 10; // Center of the second circle

    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const width = Math.abs(x1 - x2); // Width based on center points
    const height = Math.abs(y1 - y2); // Height based on center points

    rect.style.left = `${left}px`;
    rect.style.top = `${top}px`;
    rect.style.width = `${width}px`;
    rect.style.height = `${height}px`;

    document.body.appendChild(rect);
}

function removeRectangle(circle1, circle2) {
    const rects = document.querySelectorAll('.rectangle');
    rects.forEach(rect => {
        const rectLeft = parseInt(rect.style.left);
        const rectTop = parseInt(rect.style.top);
        const rectWidth = parseInt(rect.style.width);
        const rectHeight = parseInt(rect.style.height);

        const x1 = parseInt(circle1.style.left) + 10; // Center of the first circle
        const y1 = parseInt(circle1.style.top) + 10; // Center of the first circle
        const x2 = parseInt(circle2.style.left) + 10; // Center of the second circle
        const y2 = parseInt(circle2.style.top) + 10; // Center of the second circle

        const left = Math.min(x1, x2);
        const top = Math.min(y1, y2);
        const width = Math.abs(x1 - x2);
        const height = Math.abs(y1 - y2);

        if (rectLeft === left && rectTop === top && rectWidth === width && rectHeight === height) {
            rect.remove();
        }
    });
}
function done() {
    pairs.forEach(pair => {
        const [circle1, circle2] = pair;
        const x1 = parseInt(circle1.style.left) + 10 - topLeft.x; // Center X of circle1
        const y1 = parseInt(circle1.style.top) + 10 - topRight.y;  // Center Y of circle1
        const x2 = parseInt(circle2.style.left) + 10 - topLeft.x; // Center X of circle2
        const y2 = parseInt(circle2.style.top) + 10 - topRight.y;  // Center Y of circle2
        coordinates.push([x1, y1, x2, y2]);
    });    
    sendData(coordinates);
}
function sendData(dataToSend) {
    const jsonObject = {
        'src': document.getElementById('to-detect').src,
        'coords': dataToSend
    };
    
    const jsonString = JSON.stringify(jsonObject);
    // Send the data to Django using Fetch API
    fetch('/', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: jsonString // Convert the data to JSON
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); // Parse the JSON response
    })
    .then(data => {
        window.location.reload();
    })
    .catch((error) => {
        console.error('Error:', error); // Handle error
    });
}