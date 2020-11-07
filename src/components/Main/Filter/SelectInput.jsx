import React, { Fragment } from "react";
import PropTypes from "prop-types";

const SelectInput = ({ onChange, value }) => (
  <Fragment>
    <label htmlFor="food-options">Food type:</label>
    <select name="food-options" onChange={onChange} value={value}>
      <option value="">--Please choose an option--</option>
      <option value="pizza">Pizza</option>
      <option value="burgers">Burger</option>
      <option value="sushi">Sushi</option>
    </select>
  </Fragment>
);

SelectInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

export { SelectInput };
