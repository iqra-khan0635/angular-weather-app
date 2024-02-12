var app = angular.module("app", []);
app.constant("API_KEY", "1782fa6b14424802b20162502241801");
app.constant("BASE_URL", "https://api.weatherapi.com/v1");

app.filter("timeFormat", function () {
  return function (localtime) {
    let hours = new Date(localtime).getHours();
    let minutes = new Date(localtime).getMinutes();

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes < 10 ? "0" : ""}${minutes} ${ampm}`;
  };
});
app.filter("getDayFromDate", function () {
  return function (date) {
    const objDate = new Date(date);
    return objDate.toLocaleDateString("en-US", { weekday: "long" });
  };
});

app.directive("horizontalLine", function () {
  return {
    restrict: "E",
    template:
      '<div class="w-full h-px bg-gradient-to-r from-white/0 via-white/90 to-white/0 my-10" ></div>',
  };
});

app.service("weatherService", function (API_KEY, BASE_URL, $http) {
  var weatherList = [];
  this.getWeatherList = function () {
    return weatherList;
  };
  this.addToWeatherList = function (weather) {
    weatherList.unshift(weather);
    console.log(weatherList);
  };
  this.searchPlaces = async function (search) {
    const response = await $http.get(`${BASE_URL}/search.json`, {
      params: { key: API_KEY, q: search },
    });
    return response.data;
  };
  this.fetchWeather = async function (placeId) {
    const params = {
      key: API_KEY,
      days: 3,
      aqi: "no",
      alerts: "no",
      q: `id:${placeId}`,
    };

    const response = await $http.get(`${BASE_URL}/forecast.json`, {
      params: params,
    });
    return response.data;
  };
});

app.controller("searchCtrl", function ($scope, weatherService) {
  $scope.search = "";
  $scope.loadingSuggestions = false;
  $scope.suggestedResult = null;

  $scope.searchPlaces = async function () {
    $scope.loadingSuggestions = true;
    try {
      $scope.suggestedResult = await weatherService.searchPlaces($scope.search);
    } catch (err) {
      console.log(err);
    } finally {
      $scope.loadingSuggestions = false;
      $scope.$apply();
    }
  };

  $scope.handleKeypress = function (event) {
    if (event.which === 13) {
      $scope.searchPlaces();
    }
  };

  $scope.getWeather = async function (place_id) {
    try {
      const weatherData = await weatherService.fetchWeather(place_id);
      weatherService.addToWeatherList(weatherData);
    } catch (err) {
      console.log(err);
    } finally {
      $scope.search = "";
      $scope.$apply();
    }
  };

  $scope.selectedPlace = async function (place) {
    $scope.search = `${place.name}, ${place.region}, ${place.country}`;
    $scope.suggestedResult = null;
    $scope.getWeather(place.id);
  };
});

app.directive("weatherCard", function () {
  return {
    template: `<div ng-if="weather" ng-class="weather.current.is_day ? 'bg-day' : 'bg-night'" class="rounded-lg text-white p-5 shadow-lg gap-6 my-6 relative overflow-hidden">
          <!-- Location and Time -->
          <div class="flex flex-row justify-between items-center">
            <div class="w-9/12 break-words">
              <i class="fa-solid fa-location-dot"></i> {{ weather.location.name }}
            </div>
            <div class="w-1/4">
              <i class="fa-solid fa-clock"></i> {{ weather.location.localtime | timeFormat }}
            </div>
          </div>
    
          <!-- Current Weather Info -->
          <div class="flex flex-col text-center my-10">
            <img ng-src="https:{{ weather.current.condition.icon }}" alt="weather-icon" class="mx-auto mb-3 bg-blend-darken" style="width: 200px" />
            <h1 class="text-8xl">{{ weather.current.temp_c | number:0 }}&deg;</h1>
            <p class="text-4xl">{{ weather.current.condition.text }}</p>
          </div>
    
          <horizontal-line></horizontal-line>
          <div class="flex flex-col text-center" ng-if="weather.forecast.forecastday">
            <!-- Your forecast content goes here -->
            <weather-forecast day="day" ng-repeat="day in weather.forecast.forecastday" />
        </div>`,
    scope: {
      weather: "=",
    },
  };
});

app.directive("weatherForecast", function () {
  return {
    template: `<div class="flex items-center justify-between w-full">
        <div class="w-1/3 text-justify">{{ day.date | getDayFromDate }}</div>
        <div class="w-1/3">
          <img
            ng-src="https:{{day.day.condition.icon}}"
            alt="weather-icon"
            width="30"
            class="mx-auto"
          />
        </div>
        <div class="w-1/3 text-right"> {{day.day.maxtemp_c | number:0}}&deg; / {{day.day.mintemp_c | number:0}}&deg;  </div>
      </div>`,
    scope: {
      day: "=",
    },
  };
});

app.controller("weatherCtrl", function ($scope, weatherService) {
  $scope.weatherList = weatherService.getWeatherList();
});
