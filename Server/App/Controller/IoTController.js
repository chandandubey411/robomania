const Issue = require("../Models/Issue");

// Simulation State
let simulationInterval = null;
let isSimulating = false;

// Mock Data
const LOCATIONS = [
    // Delhi coordinates
    { lat: 28.6139, lng: 77.2090, name: "Connaught Place" },
    { lat: 28.7041, lng: 77.1025, name: "Pitampura" },
    { lat: 28.5355, lng: 77.3910, name: "Noida Sector 18" },
    { lat: 28.6448, lng: 77.2167, name: "Karol Bagh" },
    { lat: 28.5244, lng: 77.1855, name: "Hauz Khas" }
];

const CATEGORIES = ["Pothole", "Water Leak", "Streetlight", "Garbage", "Road Safety"];

const DESCRIPTIONS = {
    Pothole: [
        "Sensor detected abnormal surface vibration indicating possible pothole formation.",
        "Depth sensor flagged a 5cm depression on the road surface.",
        "Impact sensor reading exceeds safety threshold."
    ],
    "Water Leak": [
        "Moisture sensor arrays detected accumulating water levels.",
        "Flow rate monitor indicates unexpected water discharge.",
        "Humidity spike detected near pipeline junction."
    ],
    Streetlight: [
        "Ambient light sensor reported zero output during night hours.",
        "Power consumption monitor dropped to zero on pole #12B.",
        "Flicker detection module triggered alert."
    ],
    Garbage: [
        "Ultrasonic fill-level sensor reports bin overflow.",
        "Weight sensor exceeds capacity limit by 20%.",
        "Vision analysis system flagged waste accumulation on sidewalk."
    ],
    "Road Safety": [
        "Camera analysis detected obstructed traffic signage.",
        "Proximity sensor flagged hazardous debris on lane 2.",
        "Speed camera auxiliary sensor reported poor visibility conditions."
    ]
};

// Helper: Get random item from array
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper: Random mock coordinates near a base point (approx 100-500m radius)
const randomGeo = (base) => {
    const r = 0.005; // ~500m
    return {
        latitude: base.lat + (Math.random() - 0.5) * r,
        longitude: base.lng + (Math.random() - 0.5) * r
    };
};

const generateIoTIssue = async (io) => {
    try {
        const category = random(CATEGORIES);
        const baseLoc = random(LOCATIONS);
        const coords = randomGeo(baseLoc);
        const desc = random(DESCRIPTIONS[category]);
        const confidence = Math.floor(Math.random() * (99 - 75) + 75); // 75% - 99%

        const newIssue = new Issue({
            title: `${category} Alert - IoT Detected`,
            description: desc,
            category,
            imageURL: "https://colorlib.com/wp/wp-content/uploads/sites/2/404-error-template-3.png", // Generic IoT sensor icon
            location: {
                latitude: coords.latitude,
                longitude: coords.longitude,
                address: `${baseLoc.name} (Sensor Location)`,
                city: "Delhi",
                state: "Delhi"
            },
            source: "IoT Auto Detection",
            confidenceScore: confidence,
            status: "Pending",
            priority: confidence > 90 ? "High" : "Medium",
        });

        // Find ANY user to attribute
        // In a real app, use a dedicated "System" user ID
        const systemUser = await require("../Models/User").findOne();
        if (!systemUser) {
            throw new Error("No users found in database to attribute IoT issue. Please create a user first.");
        }
        newIssue.createdBy = systemUser._id;

        await newIssue.save();

        // Log
        console.log(`🤖 IoT GENERATED: ${newIssue.title} (${confidence}%)`);

        // Emit Real-time
        if (io) {
            io.emit("new-iot-issue", newIssue);
        }

        return newIssue;

    } catch (err) {
        console.error("IoT Generation Error:", err);
        throw err;
    }
};

// 🟢 Start Simulation
const startSimulation = (req, res) => {
    if (isSimulating) {
        return res.status(400).json({ message: "Simulation already running 🏃‍♂️" });
    }

    isSimulating = true;
    const io = req.app.get("io");

    // Emit start event
    io.emit("iot-status", { isSimulating: true });

    // Start interval
    simulationInterval = setInterval(async () => {
        try {
            await generateIoTIssue(io);
        } catch (err) {
            console.error("Simulation Interval Error:", err);
        }
    }, 10000); // Every 10 seconds

    res.json({ message: "IoT Simulation Started 🚀" });
};

// 🔴 Stop Simulation
const stopSimulation = (req, res) => {
    if (!isSimulating) {
        return res.status(400).json({ message: "Simulation is not running 🛑" });
    }

    isSimulating = false;
    clearInterval(simulationInterval);
    simulationInterval = null;

    const io = req.app.get("io");
    io.emit("iot-status", { isSimulating: false });

    res.json({ message: "IoT Simulation Stopped ⏹️" });
};

// ⚡ Trigger Single
const triggerSingle = async (req, res) => {
    try {
        const io = req.app.get("io");
        const issue = await generateIoTIssue(io);
        res.json({ message: "Manual IoT Issue Triggered 🤖", issue });
    } catch (err) {
        res.status(500).json({ message: "Failed to generate IoT issue", error: err.message });
    }
};

// ℹ️ Status
const getStatus = (req, res) => {
    res.json({ isSimulating });
};

module.exports = { startSimulation, stopSimulation, triggerSingle, getStatus };
