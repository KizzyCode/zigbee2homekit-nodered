const colorconv = require("./colorconv");


/**
 * Translates a Zigbee light bulb state into a HomeKit compatible state
 * @param {*} msg The message to translate
 */
function light_bulb(msg) {
    // Create a new payload
    const translated = { /* no fields yet */ };

    // Translate state if any
    if (msg.payload.hasOwnProperty("state")) {
        translated["On"] = msg.payload["state"] === "ON";
    } else {
        translated["On"] = "NO_RESPONSE";
    }

    // Translate brightness if any
    if (msg.payload.hasOwnProperty("brightness")) {
        translated["Brightness"] = Math.round(msg.payload["brightness"] / 2.55);
    }

    // Translate color temperature if any
    if (msg.payload.hasOwnProperty("color_temp")) {
        translated["ColorTemperature"] = msg.payload["color_temp"];
    }

    // Translate color if any
    if (msg.payload.hasOwnProperty("color")) {
        // Get the values and perform the conversion
        // (undefined `Brightness` is ok because `cie_to_hsv` has a default argument in place)
        const x = msg.payload["color"]["x"],
            y = msg.payload["color"]["y"],
            brightness = translated["Brightness"];
        const hsv = colorconv.cie_to_hsv(x, y, brightness);

        // Set payload fields
        translated["Hue"] = hsv.h;
        translated["Saturation"] = hsv.s;
    }

    // Return the new payload
    return { payload: translated };
}


/**
 * Translates a Zigbee motion sensor state into a HomeKit compatible state
 * @param {*} msg The message to translate
 */
function motion_sensor(msg) {
    // Create a new payload
    const translated = { /* no fields yet */ };

    // Translate occupancy if any
    if (msg.payload.hasOwnProperty("occupancy")) {
        translated["MotionDetected"] = msg.payload["occupancy"];
        translated["StatusActive"] = true;
    } else {
        translated["MotionDetected"] = false;
        translated["StatusActive"] = false;
    }

    // Translate battery state if any
    if (msg.payload.hasOwnProperty("battery")) {
        translated["StatusLowBattery"] = msg.payload["battery"] < 25;
    }

    // Return the new payload
    return { payload: translated };
}


module.exports = function(RED) {
    function zigbee2homekit(config) {
        // Create the node
        RED.nodes.createNode(this, config);
        
        // Register the on-"input"-handler
        this.on("input", function(msg, send, done) {
            try {
                // The translator functions for the different device kinds
                const translators = {
                    "Light Bulb": light_bulb,
                    "Motion Sensor": motion_sensor
                };

                // Select the appropriate mapper
                const selected = translators[config.kind];
                if (selected === undefined) {
                    throw "Invalid device kind: " + config.kind;
                }

                // Call the appropriate mapper and finish the flow
                const result = selected(msg);
                send(result);
                done();
            } catch (e) {
                // Propagate error to node red
                done(e);
            }
        });
    }
    RED.nodes.registerType("zigbee to homekit", zigbee2homekit);
}
