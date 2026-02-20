import React, { useState, useEffect, useRef } from "react";

const LocationSearchInput = ({
    placeholder,
    value,
    onChange,
    onSelect,
    className,
}) => {
    const [query, setQuery] = useState(value || "");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);

    // Sync internal state if external value changes (e.g. clear button)
    useEffect(() => {
        setQuery(value);
    }, [value]);

    // Handle outside click to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // Debounce search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query && query.length > 2 && showSuggestions) {
                setLoading(true);
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                            query
                        )}&format=json&addressdetails=1&limit=5`,
                        { headers: { "Accept-Language": "en" } }
                    );
                    const data = await res.json();
                    setSuggestions(data);
                } catch (error) {
                    console.error("Geocoding error:", error);
                    setSuggestions([]);
                } finally {
                    setLoading(false);
                }
            } else {
                setSuggestions([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query, showSuggestions]);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        setShowSuggestions(true);
        if (onChange) onChange(val);
    };

    const handleSelect = (item) => {
        const displayName = item.display_name;
        setQuery(displayName);
        setShowSuggestions(false);
        if (onSelect) {
            onSelect({
                name: displayName,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
                raw: item,
            });
        }
        // Also notify parent of the string change
        if (onChange) onChange(displayName);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <input
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
                placeholder={placeholder}
                className={className}
            />

            {showSuggestions && (query.length > 2) && (
                <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {loading ? (
                        <div className="p-3 text-sm text-gray-500 text-center">Loading...</div>
                    ) : suggestions.length > 0 ? (
                        <ul>
                            {suggestions.map((item, index) => (
                                <li
                                    key={index}
                                    onClick={() => handleSelect(item)}
                                    className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors"
                                >
                                    <p className="text-sm font-medium text-gray-800 truncate">
                                        {item.display_name.split(",")[0]}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {item.display_name}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-3 text-sm text-gray-400 text-center">No results found</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LocationSearchInput;
