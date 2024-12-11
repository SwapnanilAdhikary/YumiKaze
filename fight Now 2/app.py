from flask import Flask, render_template, request
import requests

app = Flask(__name__)

# Your OpenWeather API key (replace with your actual key)
OPENWEATHER_API_KEY = '1c9b7742ec5458b05234bc9639ed8a3e'

def get_weather_data(city):
    """Fetch current weather data from OpenWeather API"""
    url = f'http://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_API_KEY}&units=metric'
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        return {"error": "Unable to fetch weather data!"}

def get_forecast_data(city):
    """Fetch 5-day weather forecast from OpenWeather API"""
    url = f'http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={OPENWEATHER_API_KEY}&units=metric'
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        return {"error": "Unable to fetch forecast data!"}

def get_aqi_data(lat, lon):
    """Fetch Air Quality Index (AQI) data from OpenWeather API"""
    url = f'http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}'
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        return {"error": "Unable to fetch AQI data!"}

def get_weather_recommendations(temp, humidity, wind_speed):
    """Provide basic weather recommendations based on temperature, humidity, and wind"""
    recommendations = []
    if temp < 10:
        recommendations.append("It's quite cold! Wear a warm coat, scarf, and gloves.")
    elif temp > 30:
        recommendations.append("It's hot outside! Wear light clothing, apply sunscreen, and stay hydrated.")
    
    if humidity > 80:
        recommendations.append("The humidity is high! Consider carrying an umbrella or staying in shade.")
    
    if wind_speed > 10:
        recommendations.append("It's windy! You might want to wear something windproof.")
    
    return recommendations

def get_aqi_recommendations(aqi):
    """Provide AQI recommendations based on AQI value"""
    recommendations = []
    if aqi == 1:
        recommendations.append("Air quality is good. It's safe to go outdoors!")
    elif aqi == 2:
        recommendations.append("Air quality is fair. Outdoor activities are okay, but limit strenuous activities.")
    elif aqi == 3:
        recommendations.append("Air quality is moderate. Sensitive groups should limit prolonged outdoor exertion.")
    elif aqi == 4:
        recommendations.append("Air quality is poor. Everyone should reduce outdoor activities.")
    else:
        recommendations.append("Air quality is very poor. Stay indoors and avoid outdoor activities.")

    return recommendations

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        city = request.form['city']
        
        # Fetch weather data
        weather_data = get_weather_data(city)
        if "error" in weather_data:
            return render_template('index.html', error_message=weather_data["error"])

        # Fetch forecast data
        forecast_data = get_forecast_data(city)
        if "error" in forecast_data:
            return render_template('index.html', error_message=forecast_data["error"])

        # Get AQI data using latitude and longitude from the current weather data
        lat = weather_data['coord']['lat']
        lon = weather_data['coord']['lon']
        aqi_data = get_aqi_data(lat, lon)
        if "error" in aqi_data:
            return render_template('index.html', error_message=aqi_data["error"])

        # Extract weather details
        main_data = weather_data.get('main', {})
        weather_description = weather_data['weather'][0]['description']
        wind_data = weather_data.get('wind', {})
        clouds_data = weather_data.get('clouds', {})

        # Extract current weather
        temp = main_data.get('temp')
        temp_min = main_data.get('temp_min')
        temp_max = main_data.get('temp_max')
        pressure = main_data.get('pressure')
        humidity = main_data.get('humidity')
        wind_speed = wind_data.get('speed')
        wind_deg = wind_data.get('deg')
        clouds_all = clouds_data.get('all')

        # Extract forecast data (next 3 days)
        forecast_list = forecast_data['list'][:3]  # First three forecast entries for next 3 days
        forecast = []
        for entry in forecast_list:
            forecast.append({
                'time': entry['dt_txt'],
                'temp': entry['main']['temp'],
                'humidity': entry['main']['humidity'],
                'description': entry['weather'][0]['description'],
            })

        # Extract AQI data
        aqi = aqi_data['list'][0]['main']['aqi']

        # Get weather and AQI recommendations
        weather_recommendations = get_weather_recommendations(temp, humidity, wind_speed)
        aqi_recommendations = get_aqi_recommendations(aqi)

        # Return all data to the HTML page
        return render_template('index.html', 
                               city=city, 
                               temp=temp, 
                               temp_min=temp_min,
                               temp_max=temp_max, 
                               pressure=pressure, 
                               humidity=humidity,
                               wind_speed=wind_speed, 
                               wind_deg=wind_deg,
                               clouds_all=clouds_all,
                               weather_description=weather_description,
                               forecast=forecast,
                               aqi=aqi,
                               weather_recommendations=weather_recommendations,
                               aqi_recommendations=aqi_recommendations)
    
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
