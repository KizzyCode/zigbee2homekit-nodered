"use strict";


/**
 * Converts a CIE color representation to RGB
 * 
 * @param {Number} x The X component
 * @param {Number} y The Y component
 * @param {Number} brightness - [1, 255]
 * @return {Array} An `{ r, g, b }`-object
 */
function cie_to_rgb(x, y, brightness) {
	const z = 1.0 - x - y,
		Y = Math.min(brightness, 254) / 254,
		X = (Y / y) * x,
    	Z = (Y / y) * z;
    
    // Use "Wide RGB D65"
	let r =  X * 1.656492 - Y * 0.354851 - Z * 0.255038,
		g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152,
		b =  X * 0.051713 - Y * 0.121364 + Z * 1.011530;

	if (r > b && r > g && r > 1.0) {
		g = g / r;
		b = b / r;
		r = 1.0;
	} else if (g > b && g > r && g > 1.0) {
		r = r / g;
		b = b / g;
		g = 1.0;
	} else if (b > r && b > g && b > 1.0) {
		r = r / b;
		g = g / b;
		b = 1.0;
    }
    
	r = Math.round(r * 255);
	g = Math.round(g * 255);
	b = Math.round(b * 255);

	return {
        r: isNaN(r) ? 0 : r,
        g: isNaN(g) ? 0 : g,
        b: isNaN(b) ? 0 : b
    };
}


/**
 * Converts an RGB color representation to CIE
 * 
 * @param {Number} r The red value from [0, 255]
 * @param {Number} g The green value from [0, 255]
 * @param {Number} b The blue value from [0, 255]
 * @return {Array} An `{ x, y }`-object
 */
function rgb_to_cie(r, g, b) {
	// Use "Wide RGB D65"
	const X = r * 0.664511 + g * 0.154324 + b * 0.162028,
		Y = r * 0.283881 + g * 0.668433 + b * 0.047685,
		Z = r * 0.000088 + g * 0.072310 + b * 0.986039;

	const x = +(X / (X + Y + Z)),
		y = +(Y / (X + Y + Z));
    
	return {
        x: isNaN(x) ? 0 : x,
        y: isNaN(y) ? 0 : y
    };
}


/**
 * Converts a HSV color to RGB
 * 
 * (Code from https://stackoverflow.com/a/17243070)
 * 
 * @param {Number} h Hue from [0, 360]
 * @param {Number} s Saturation from [0, 100]
 * @param {Number} v Brightness from [0, 100]
 * @return {Object} An `{ r, g, b }`-object
 */
function hsv_to_rgb(h, s, v) {
    h = h / 360,
        s = s / 100,
        v = v / 100;

    const i = Math.floor(h * 6),
        f = h * 6 - i,
        p = v * (1 - s),
        q = v * (1 - f * s),
        t = v * (1 - (1 - f) * s);

    let r, g, b;
    switch (i % 6) {
        case 0:
            r = v, g = t, b = p;
            break;
        case 1:
            r = q, g = v, b = p;
            break;
        case 2:
            r = p, g = v, b = t;
            break;
        case 3:
            r = p, g = q, b = v;
            break;
        case 4:
            r = t, g = p, b = v;
            break;
        case 5:
            r = v, g = p, b = q;
            break;
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}


/**
 * Converts a RGB color to HSV
 * 
 * Code from https://stackoverflow.com/a/17243070)
 * 
 * @param {Number} r Red from [0, 255]
 * @param {Number} g Green from [0, 255]
 * @param {Number} b Blue from [0, 255]
 * @return {Object} An `{ h, s, v }`-object
 */
function rgb_to_hsv(r, g, b) {
    const max = Math.max(r, g, b),
        min = Math.min(r, g, b),
        d = max - min,
        s = (max === 0 ? 0 : d / max),
        v = max / 255;

    let h;
    switch (max) {
        case min:
            h = 0;
            break;
        case r:
            h = (g - b) + d * (g < b ? 6 : 0);
            h /= 6 * d;
            break;
        case g:
            h = (b - r) + d * 2;
            h /= 6 * d;
            break;
        case b:
            h = (r - g) + d * 4;
            h /= 6 * d;
            break;
    }

    return {
        h: +(h * 360),
        s: +(s * 100),
        v: +(v * 100)
    };
}


/**
 * Converts a CIE color representation to HSV
 * 
 * @param {Number} x The X component
 * @param {Number} y The Y component
 * @return {Array} An `{ h, s, v }`-object
 */
module.exports.cie_to_hsv = function(x, y, brightness = 255) {
	const { r, g, b } = cie_to_rgb(x, y, brightness);
	return rgb_to_hsv(r, g, b);
}


/**
 * Converts a HSV color representation to CIE
 * 
 * @param {Number} h Hue from [0, 360]
 * @param {Number} s Saturation from [0, 100]
 * @param {Number} v Brightness from [0, 100]
 * @return {Array} A `{ x, y }`-object
 */
module.exports.hsv_to_cie = function(h, s, v = 100) {
	const { r, g, b } = hsv_to_rgb(h, s, v);
	return rgb_to_cie(r, g, b);
}
