import React from "react";
import { Filter, SelectInput } from "./Filter";
import { makeCancelablePromise } from "../../helpers";
import "./Main.css";

const COORDS = {
  "Europe/Berlin": { lat: 52.518611, lng: 13.408333 },
};

const TRIES_TO_LOAD_MAP_BEFORE_FAILURE = 2;

class Main extends React.Component {
  state = {
    businesses: [],
    foodCategory: "",
  };

  // keep a markers reference here so we can clear them later
  markers = [];
  mapsApiLoaded = null;
  mapInstance = null;
  countTriesToLoadMap = 0;
  fetchRestaurantsPromise = null;

  componentDidMount = async () => {
    /*
     * It seems that this is causing a memory leak that I discovered during testing.
     * This happens because component tries to set state when the component umounts.
     * To verify, remove the makeCancelable wrapper, and run the test from this file
     * src/main/index.test.js
     * The solution found, according to the docs
     * in https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html, is to cancel the promise when the component unmounts
     */
    this.fetchRestaurantsPromise = makeCancelablePromise(
      this.fetchRestaurants()
    );

    try {
      const result = await this.fetchRestaurantsPromise.promise;
      this.setState({ businesses: result.businesses || [] });
    } catch (err) {
      this.handleError(err);
    }

    /* Our goal should be to give user the information as fast as possible
     * Considering that, instead of a timeout we can use an interval. The
     * interval will check if map is loaded(same functionality as before),
     * and will give up after 2 times.
     * This way we can also be optimistic and start with 50ms
     */
    this.mapsApiLoaded = window.setInterval(this.checkMapsApi, 50);
  };

  componentDidUpdate = async (_, prevState) => {
    if (prevState.foodCategory !== this.state.foodCategory) {
      try {
        const result = await this.fetchRestaurants();
        this.clearMarkers();
        this.setState(
          { ...this.state, businesses: result.businesses || [] },
          () => {
            if (this.state.foodCategory) {
              this.placeMarkersOnMap();
            }
          }
        );
      } catch (e) {
        this.handleError(e);
      }
    }
  };

  componentWillUnmount = () => {
    this.fetchRestaurantsPromise.cancel();
  };

  handleError = (error) => {
    // we could throw instead
    console.log(error);
  };

  fetchRestaurants = async () => {
    const query = {
      limit: 50,
      location: "Berlin, Germany",
      term: "restaurants",
      ...(this.state.foodCategory
        ? { categories: this.state.foodCategory }
        : {}),
    };
    const urlParams = new URLSearchParams(query);
    const response = await fetch(`/-/search?${urlParams}`);
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message);
    }
    return body;
  };

  checkMapsApi = () => {
    if (this.countTriesToLoadMap === TRIES_TO_LOAD_MAP_BEFORE_FAILURE) {
      window.clearInterval(this.mapsApiLoaded);
      // instead of throwing an error maybe is better to set the state
      // and show a message to the user
      throw Error("giving up");
    }
    if (window.google && window.google.maps) {
      window.clearInterval(this.mapsApiLoaded);
      this.initMap();
    } else {
      this.countTriesToLoadMap += 1;
      console.log(
        `attempt to load map failed, ${this.countTriesToLoadMap} times`
      );
    }
  };

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
    try {
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
    } catch (e) {
      this.handleError(e);
    }
  };

  // clears markers from map. It first checks if there is a mapInstance,
  // and if we have any markers on map. If we don't have any markers then
  // there is no need to do the extra loop
  clearMarkers = () => {
    if (this.mapInstance && this.markers.length > 0) {
      this.markers.forEach((marker) => marker.setMap(null));
      this.markers = [];
    }
  };

  // button clear handler. fetches a fresh list of restaurants without category
  // and then clears the markers from map
  handleClearMarkers = () => this.setState({ ...this.state, foodCategory: "" });

  // select input is a controlled component. On category change
  // update state with the new category
  handleFoodCategoryChange = ({ target: { value } }) =>
    this.setState({ ...this.state, foodCategory: value });

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
