import React, { useState, useEffect } from "react";

const IoTControlPanel = () => {
    const [isSimulating, setIsSimulating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lastTrigger, setLastTrigger] = useState(null);

    useEffect(() => {
        fetch("http://localhost:8080/api/iot/status")
            .then((res) => res.json())
            .then((data) => setIsSimulating(data.isSimulating))
            .catch((err) => console.error("IoT Status Error:", err));
    }, []);

    const toggleSimulation = async () => {
        setLoading(true);
        const endpoint = isSimulating ? "stop" : "start";
        try {
            await fetch(`http://localhost:8080/api/iot/${endpoint}`, { method: "POST" });
            setIsSimulating(!isSimulating);
        } catch (err) {
            console.error("IoT Toggle Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const triggerManual = async () => {
        try {
            setLastTrigger("Triggering...");
            await fetch("http://localhost:8080/api/iot/trigger", { method: "POST" });
            setLastTrigger("Issue Generated! 🤖");
            setTimeout(() => setLastTrigger(null), 3000);
        } catch (err) {
            console.error("IoT Trigger Error:", err);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-extrabold text-indigo-900 flex items-center gap-2">
                        🤖 IoT Simulation Mode
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        (Hackathon Prototype) — Mimics Smart City Sensor Data
                    </p>
                </div>

                {isSimulating && (
                    <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold animate-pulse">
                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        Active
                    </span>
                )}
            </div>

            <div className="flex gap-4">
                <button
                    onClick={toggleSimulation}
                    disabled={loading}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all text-sm shadow-sm ${isSimulating
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                >
                    {loading ? "Processing..." : isSimulating ? "🛑 Stop Simulation" : "🚀 Start Simulation"}
                </button>

                <button
                    onClick={triggerManual}
                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all text-sm border border-gray-200"
                >
                    ⚡ Trigger Single Issue
                </button>
            </div>

            {lastTrigger && (
                <p className="mt-3 text-center text-sm font-medium text-emerald-600">
                    {lastTrigger}
                </p>
            )}

            {/* Pipeline Visualization */}
            <div className="mt-6 border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="text-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-1">📡</div>
                        Virtual Sensors
                    </div>
                    <div className="h-0.5 w-8 bg-gray-200"></div>
                    <div className="text-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-1">☁️</div>
                        API
                    </div>
                    <div className="h-0.5 w-8 bg-gray-200"></div>
                    <div className="text-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-1">🗄️</div>
                        DB
                    </div>
                    <div className="h-0.5 w-8 bg-gray-200"></div>
                    <div className="text-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-1">💻</div>
                        Dashboard
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IoTControlPanel;
