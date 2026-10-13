AQI_ADVICE = {
    "Good": "Air is clean. Enjoy outdoor activities.",
    "Satisfactory": (
        "Air quality is acceptable for most people. "
        "Sensitive people should be careful."
    ),
    "Moderate": (
        "People with asthma or heart problems should avoid "
        "heavy outdoor work."
    ),
    "Poor": "Avoid long outdoor exercise. Consider wearing a mask.",
    "Very Poor": (
        "Stay indoors as much as possible. "
        "Wear a mask when going outside."
    ),
    "Severe": "Health emergency. Avoid going outside.",
}


def get_aqi_category(aqi: float) -> str:
    """Return the Indian AQI category for a numeric AQI value."""
    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Satisfactory"
    if aqi <= 200:
        return "Moderate"
    if aqi <= 300:
        return "Poor"
    if aqi <= 400:
        return "Very Poor"
    return "Severe"


def get_aqi_advice(category: str) -> str:
    """Return health advice for an AQI category."""
    return AQI_ADVICE.get(category, "No advice available.")
