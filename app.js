// Main application
document.addEventListener('DOMContentLoaded', function() {
    // Get canvas and context
    const canvas = document.getElementById('graph-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        redrawGraphs();
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Graph settings
    let graphs = [];
    let currentColor = '#3366ff';
    let currentLineWidth = 2;
    
    // DOM elements
    const equationInput = document.getElementById('equation-input');
    const plotButton = document.getElementById('plot-button');
    const clearButton = document.getElementById('clear-button');
    const xMinInput = document.getElementById('x-min');
    const xMaxInput = document.getElementById('x-max');
    const yMinInput = document.getElementById('y-min');
    const yMaxInput = document.getElementById('y-max');
    const lineColorInput = document.getElementById('line-color');
    const lineWidthInput = document.getElementById('line-width');
    
    // Event listeners
    plotButton.addEventListener('click', plotEquation);
    clearButton.addEventListener('click', clearGraphs);
    lineColorInput.addEventListener('input', updateLineColor);
    lineWidthInput.addEventListener('input', updateLineWidth);
    
    // Range inputs should trigger redraw when changed
    [xMinInput, xMaxInput, yMinInput, yMaxInput].forEach(input => {
        input.addEventListener('change', redrawGraphs);
    });
    
    // Also allow Enter key in equation input
    equationInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            plotEquation();
        }
    });
    
    function updateLineColor() {
        currentColor = lineColorInput.value;
        redrawGraphs();
    }
    
    function updateLineWidth() {
        currentLineWidth = parseInt(lineWidthInput.value);
        redrawGraphs();
    }
    
    function plotEquation() {
        const equationText = equationInput.value.trim();
        if (!equationText) return;
        
        try {
            // Create a function from the equation
            const fn = math.compile(equationText);
            
            // Add to graphs list
            graphs.push({
                equation: equationText,
                fn: fn,
                color: currentColor,
                lineWidth: currentLineWidth
            });
            
            // Redraw
            redrawGraphs();
            
            // Clear input
            equationInput.value = '';
        } catch (error) {
            alert(`Error in equation: ${error.message}`);
            console.error(error);
        }
    }
    
    function clearGraphs() {
        graphs = [];
        redrawGraphs();
    }
    
    function redrawGraphs() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Get current ranges
        const xMin = parseFloat(xMinInput.value);
        const xMax = parseFloat(xMaxInput.value);
        const yMin = parseFloat(yMinInput.value);
        const yMax = parseFloat(yMaxInput.value);
        
        // Draw axes
        drawAxes(xMin, xMax, yMin, yMax);
        
        // Draw each graph
        graphs.forEach(graph => {
            drawFunction(graph.fn, xMin, xMax, yMin, yMax, graph.color, graph.lineWidth);
        });
    }
    
    function drawAxes(xMin, xMax, yMin, yMax) {
        ctx.save();
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        
        // Calculate where the axes should be
        const xAxisY = yMin <= 0 && yMax >= 0 ? 
            canvas.height * (1 - (0 - yMin) / (yMax - yMin)) : -1;
        const yAxisX = xMin <= 0 && xMax >= 0 ? 
            canvas.width * (0 - xMin) / (xMax - xMin) : -1;
        
        // Draw x-axis
        if (xAxisY >= 0 && xAxisY <= canvas.height) {
            ctx.beginPath();
            ctx.moveTo(0, xAxisY);
            ctx.lineTo(canvas.width, xAxisY);
            ctx.stroke();
            
            // Draw ticks on x-axis
            const xRange = xMax - xMin;
            const xTickInterval = calculateTickInterval(xRange, canvas.width);
            
            let firstTick = Math.ceil(xMin / xTickInterval) * xTickInterval;
            for (let x = firstTick; x <= xMax; x += xTickInterval) {
                const screenX = (x - xMin) / (xMax - xMin) * canvas.width;
                ctx.beginPath();
                ctx.moveTo(screenX, xAxisY - 5);
                ctx.lineTo(screenX, xAxisY + 5);
                ctx.stroke();
                
                // Label
                ctx.fillStyle = '#666666';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(x.toFixed(2), screenX, xAxisY + 8);
            }
        }
        
        // Draw y-axis
        if (yAxisX >= 0 && yAxisX <= canvas.width) {
            ctx.beginPath();
            ctx.moveTo(yAxisX, 0);
            ctx.lineTo(yAxisX, canvas.height);
            ctx.stroke();
            
            // Draw ticks on y-axis
            const yRange = yMax - yMin;
            const yTickInterval = calculateTickInterval(yRange, canvas.height);
            
            let firstTick = Math.ceil(yMin / yTickInterval) * yTickInterval;
            for (let y = firstTick; y <= yMax; y += yTickInterval) {
                const screenY = canvas.height - (y - yMin) / (yMax - yMin) * canvas.height;
                ctx.beginPath();
                ctx.moveTo(yAxisX - 5, screenY);
                ctx.lineTo(yAxisX + 5, screenY);
                ctx.stroke();
                
                // Label
                ctx.fillStyle = '#666666';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText(y.toFixed(2), yAxisX - 8, screenY);
            }
        }
        
        ctx.restore();
    }
    
    function calculateTickInterval(range, pixels) {
        // Estimate how many pixels per tick we want (about 50-100px between ticks)
        const targetPixelsPerTick = 70;
        const approxNumTicks = pixels / targetPixelsPerTick;
        const rawInterval = range / approxNumTicks;
        
        // Round to nearest "nice" number (1, 2, 5, 10, etc.)
        const exponent = Math.floor(Math.log10(rawInterval));
        const magnitude = Math.pow(10, exponent);
        const normalized = rawInterval / magnitude;
        
        let niceInterval;
        if (normalized < 1.5) {
            niceInterval = 1 * magnitude;
        } else if (normalized < 3) {
            niceInterval = 2 * magnitude;
        } else if (normalized < 7) {
            niceInterval = 5 * magnitude;
        } else {
            niceInterval = 10 * magnitude;
        }
        
        return niceInterval;
    }
    
    function drawFunction(fn, xMin, xMax, yMin, yMax, color, lineWidth) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        
        const step = (xMax - xMin) / canvas.width;
        let firstValidPoint = false;
        
        for (let screenX = 0; screenX < canvas.width; screenX++) {
            const x = xMin + (screenX / canvas.width) * (xMax - xMin);
            
            try {
                const y = fn.evaluate({x: x});
                
                // Skip if outside y range (but still valid mathematically)
                if (y < yMin || y > yMax) {
                    firstValidPoint = false;
                    continue;
                }
                
                const screenY = canvas.height - ((y - yMin) / (yMax - yMin) * canvas.height);
                
                if (!firstValidPoint) {
                    ctx.moveTo(screenX, screenY);
                    firstValidPoint = true;
                } else {
                    ctx.lineTo(screenX, screenY);
                }
            } catch (error) {
                // Function undefined at this point (like division by zero)
                firstValidPoint = false;
            }
        }
        
        ctx.stroke();
        ctx.restore();
    }
    
    // Service Worker registration for offline capability
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').then(registration => {
                console.log('ServiceWorker registration successful');
            }).catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }
});