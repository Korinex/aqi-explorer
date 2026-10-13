from fastapi.testclient import TestClient

from server.app.main import app
from src.aqi_core import get_aqi_advice, get_aqi_category


client = TestClient(app)


def test_aqi_categories_cover_expected_boundaries():
    assert get_aqi_category(50) == "Good"
    assert get_aqi_category(100) == "Satisfactory"
    assert get_aqi_category(200) == "Moderate"
    assert get_aqi_category(300) == "Poor"
    assert get_aqi_category(400) == "Very Poor"
    assert get_aqi_category(401) == "Severe"
    assert "outdoor" in get_aqi_advice("Poor").lower()


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cities_endpoint_contains_known_city():
    response = client.get("/api/cities")
    assert response.status_code == 200
    assert "Delhi" in response.json()["cities"]


def test_aqi_lookup_returns_report():
    response = client.get("/api/aqi", params={"city": "Delhi", "date": "2019-05-01"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["city"] == "Delhi"
    assert payload["date"] == "2019-05-01"
    assert payload["aqi"] == 285.0
    assert payload["category"] == "Poor"
    assert "PM2.5" in payload["pollutants"]


def test_aqi_lookup_rejects_invalid_date():
    response = client.get("/api/aqi", params={"city": "Delhi", "date": "not-a-date"})
    assert response.status_code == 400


def test_aqi_lookup_returns_not_found_for_unknown_record():
    response = client.get("/api/aqi", params={"city": "Atlantis", "date": "2019-05-01"})
    assert response.status_code == 404


def test_history_endpoint_returns_ordered_points():
    response = client.get("/api/history", params={"city": "Delhi", "limit": 12})
    assert response.status_code == 200
    payload = response.json()
    assert payload["city"] == "Delhi"
    assert len(payload["points"]) == 12
    assert payload["points"][0]["date"] < payload["points"][-1]["date"]
    assert isinstance(payload["points"][-1]["aqi"], float)


def test_history_endpoint_rejects_unknown_city():
    response = client.get("/api/history", params={"city": "Atlantis"})
    assert response.status_code == 404
