import { hsv_to_cie } from "./colorconv";


/**
 * Translates a Zigbee lightbulb state into a HomeKit compatible state
 * @param {*} msg The message to translate
 */
function light_bulb(msg) {
    // Create a new payload
    const translated = { /* no fields yet */ };

    // Translate state if any
    if (msg.payload.hasOwnProperty("On")) {
        translated["state"] = msg.payload["On"] ? "ON" : "OFF";
    }

    // Translate brightness if any
    if (msg.payload.hasOwnProperty("Brightness")) {
        translated["brightness"] = Math.round(msg.payload["Brightness"] * 2.55)
    }

    // Translate color temperature if any
    if (msg.payload.hasOwnProperty("ColorTemperature")) {
        translated["color_temp"] = msg.payload["ColorTemperature"];
    }

    // Translate color
    // FIXME: Cache `Hue` or `Saturation` to combine two steps into one?
    if (msg.payload.hasOwnProperty("Hue") || msg.payload.hasOwnProperty("Saturation")) {
        // Get hue
        let hue = msg.payload["Hue"];
        if (hue === undefined) {
            hue = msg.hap.allChars["Hue"];
        }

        // Get saturation
        let saturation = msg.payload["Saturation"];
        if (saturation === undefined) {
            saturation = msg.hap.allChars["Saturation"];
        }

        // Get brightness
        let brightness = msg.payload["Brightness"];
        if (brightness === undefined) {
            brightness = msg.hap.allChars["Brightness"];
        }

        // Translate color
        let xy = hsv_to_cie(hue, saturation, brightness);
        translated["color"] = xy;
    }
    
    // Return the new payload
    return { payload: translated };
}


module.exports = function(RED) {
    function homekit2zigbee(config) {
        // Create the node
        RED.nodes.createNode(this, config);
        
        // Register the on-"input"-handler
        this.on("input", function(msg, send, done) {
            try {
                // The translator functions for the different device kinds
                const translators = {
                    "Light Bulb": light_bulb
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
    RED.nodes.registerType("homekit to zigbee", homekit2zigbee);
}
