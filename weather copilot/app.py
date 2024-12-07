from flask import Flask, render_template, request, jsonify
import requests
import re

app = Flask(__name__)

API_KEY = "f55561b2a685e4a4575fb00d723b053c"  # Replace with your OpenWeatherMap API key


def get_lat_lon(city):
    """Fetch latitude and longitude for a given city."""
    try:
        url = f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={API_KEY}"
        response = requests.get(url).json()
        if response and len(response) > 0:
            lat = response[0]["lat"]
            lon = response[0]["lon"]
            return lat, lon
        else:
            return None, None
    except Exception as e:
        print(f"Error fetching lat/lon for {city}: {e}")
        return None, None


def get_recommendation(weather_desc, aqi):
    """Generate a recommendation based on weather and AQI."""
    recommendation = ""

    # Umbrella recommendation based on weather conditions
    if "rain" in weather_desc.lower() or "shower" in weather_desc.lower():
        recommendation += "You should carry an umbrella. "

    # Health recommendation based on AQI
    if aqi in ["Poor", "Very Poor"]:
        recommendation += "Consider wearing a mask and avoiding outdoor activities."

    return recommendation.strip()


def get_forecast(lat, lon):
    """Fetch 3-day weather forecast."""
    try:
        forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
        response = requests.get(forecast_url).json()

        if "list" in response:
            forecast_data = response["list"][:8]  # Get first 24 hours (8 x 3-hour intervals)
            forecast_summary = []
            for forecast in forecast_data:
                temp = forecast["main"]["temp"]
                weather_desc = forecast["weather"][0]["description"]
                time = forecast["dt_txt"]
                forecast_summary.append(f"{time}: {weather_desc}, {temp}°C")
            return "\n".join(forecast_summary)
        else:
            return "Forecast data unavailable."
    except Exception as e:
        print(f"Error fetching forecast: {e}")
        return "Error fetching forecast."


def handle_weather_query(user_input):
    """Handle weather queries."""
    match = re.search(r"(?:temperature|weather|AQI) in ([\w\s]+)", user_input, re.IGNORECASE)
    city = match.group(1).strip() if match else None

    if city:
        # Get latitude and longitude
        lat, lon = get_lat_lon(city)
        if not lat or not lon:
            return f"Sorry, I couldn't find the location for {city}. Please check the city name."

        try:
            # Weather API request
            weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
            weather_response = requests.get(weather_url).json()

            if weather_response.get("cod") != 200:
                return f"Sorry, I couldn't fetch the weather details for {city}. Please try again later."

            weather_desc = weather_response["weather"][0]["description"]
            temperature = weather_response["main"]["temp"]
            humidity = weather_response["main"]["humidity"]
            wind_speed = weather_response["wind"]["speed"]
            pressure = weather_response["main"]["pressure"]

            # AQI API request
            aqi_url = f"https://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={API_KEY}"
            aqi_response = requests.get(aqi_url).json()

            if "list" in aqi_response and len(aqi_response["list"]) > 0:
                aqi = aqi_response["list"][0]["main"]["aqi"]
                aqi_description = {
                    1: "Good",
                    2: "Fair",
                    3: "Moderate",
                    4: "Poor",
                    5: "Very Poor"
                }.get(aqi, "Unknown")
            else:
                aqi_description = "Unavailable"

            # Generate recommendation
            recommendation = get_recommendation(weather_desc, aqi_description)

            # Fetch 3-day forecast
            forecast = get_forecast(lat, lon)

            # Construct the reply
            reply = (
                f"The current weather in {city} is {weather_desc} with a temperature of {temperature}°C.\n"
                f"Humidity: {humidity}%\n"
                f"Wind Speed: {wind_speed} m/s\n"
                f"Pressure: {pressure} hPa\n"
                f"Air Quality Index (AQI): {aqi_description}\n\n"
                f"Recommendation: {recommendation}\n\n"
                f"3-Day Forecast:\n{forecast}"
            )
            return reply

        except Exception as e:
            return f"An error occurred while fetching the weather: {str(e)}"
    else:
        return "I couldn't understand the city name in your query. Please specify it clearly."


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/ask", methods=["POST"])
def ask():
    user_message = request.json.get("message", "")
    reply = handle_weather_query(user_message)
    return jsonify({"reply": reply})


if __name__ == "__main__":
    app.run(debug=True)
