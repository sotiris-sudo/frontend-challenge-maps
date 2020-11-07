import React from "react";
import { Filter, SelectInput } from "./Filter";
import "./Main.css";

const COORDS = {
  "Europe/Berlin": { lat: 52.518611, lng: 13.408333 },
};

/**
 * This is taken as is from https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
 */
const makeCancelable = (promise) => {
  let hasCanceled_ = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    promise.then(
      (val) => (hasCanceled_ ? reject({ isCanceled: true }) : resolve(val)),
      (error) => (hasCanceled_ ? reject({ isCanceled: true }) : reject(error))
    );
  });

  return {
    promise: wrappedPromise,
    cancel() {
      hasCanceled_ = true;
    },
  };
};

class Main extends React.Component {
  state = {
    businesses: [],
    foodCategory: "",
  };

  // keep a markers reference here so we can clear them later
  markers = [];
  mapsApiLoaded = null;
  mapInstance = null;
  fetchRestaurantsPromise = null;

  componentDidMount() {
    /*
     * It seems that this is causing a memory leak that I discovered during testing.
     * This happens because component tries to set state when the component unmounts.
     * To verify, remove the makeCancelable wrapper, and run the test from this file
     * src/main/index.test.js
     * The solution found, according to the docs
     * in https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html, is to cancel the promise when the component unmounts
     */
    this.fetchRestaurantsPromise = makeCancelable(this.fetchRestaurants());

    this.fetchRestaurantsPromise.promise
      .then((res) => this.setState({ businesses: res.businesses || [] }))
      .catch((err) => console.log(err));

    this.mapsApiLoaded = window.setTimeout(this.checkMapsApi.bind(this), 200);
  }

  componentWillUnmount = () => {
    this.fetchRestaurantsPromise.cancel();
  };

  fetchRestaurants = async (category) => {
    const query = {
      limit: 50,
      location: "Berlin, Germany",
      term: "restaurants",
      ...(category ? { categories: category } : {}),
    };
    const urlParams = new URLSearchParams(query);
    const response = await fetch(`/-/search?${urlParams}`);
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message);
    }
    return body;
  };

  checkMapsApi() {
    if (window.google && window.google.maps) {
      window.clearTimeout(this.mapsApiLoaded);
      this.initMap();
    }
  }

  initMap() {
    const mapEl = document.getElementById("places-map");
    if (mapEl && !this.mapInstance) {
      this.mapInstance = new window.google.maps.Map(mapEl, {
        center: COORDS["Europe/Berlin"],
        zoom: 8,
      });
    }
  }

  placeMarkersOnMap = () => {
    // do not place markers if first option is selected from <SelectInput/>
    if (this.mapInstance && this.state.foodCategory) {
      this.markers = this.state.businesses.map(
        ({ coordinates }) =>
          new window.google.maps.Marker({
            map: this.mapInstance,
            position: {
              lat: coordinates.latitude,
              lng: coordinates.longitude,
            },
          })
      );
    } else {
      // handle map instance not there error
    }
  };

  // clears markers from map. It first checks if there is a mapInstance,
  // and if we have any markers on map. If we don't have any markers then
  // there is no need to do the extra loop
  clearMarkers = () => {
    if (this.mapInstance && this.markers.length > 0) {
      this.markers.map((marker) => marker.setMap(null));
      this.markers = [];
    }
  };

  // button clear handler. fetches a fresh list of restaurants without category
  // and then clears the markers from map
  handleClearMarkers = () => {
    this.fetchRestaurants()
      .then((res) => {
        this.setState(
          { businesses: res.businesses || [], foodCategory: "" },
          this.clearMarkers
        );
      })
      .catch((err) => console.error(err));
  };

  // select input is a controlled component. On category change
  // update state with the new category
  handleFoodCategoryChange = (e) => {
    const {
      target: { value },
    } = e;
    // before changing category we need to clear the old markers from map
    this.clearMarkers();
    this.fetchRestaurants(value)
      .then((res) => {
        this.setState(
          { businesses: res.businesses || [], foodCategory: value },
          // after state is set with the new businesses, place the new markers on map
          this.placeMarkersOnMap
        );
      })
      .catch((err) => console.error(err));
  };

  render() {
    return (
      <main>
        <Filter onClear={this.handleClearMarkers}>
          <SelectInput
            onChange={this.handleFoodCategoryChange}
            value={this.state.foodCategory}
          />
        </Filter>
        <div id="places-map" className="places-map"></div>
        {this.state.businesses.map((business) => {
          return (
            <div
              className="card"
              key={business.id}
              data-testid="restaurantCard"
            >
              <img src={business.image_url} alt={business.name} />
              <div className="container">
                <h4>
                  <a href={business.url}>{business.name}</a>
                </h4>
                {business.location && business.location.display_address && (
                  <p>
                    {business.location.display_address[0]}
                    <br />
                    {business.location.display_address[1]}
                  </p>
                )}
                <p>{business.display_phone}</p>
              </div>
            </div>
          );
        })}
      </main>
    );
  }
}

export default Main;
