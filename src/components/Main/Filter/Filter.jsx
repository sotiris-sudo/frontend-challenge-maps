import React from "react";
import PropTypes from "prop-types";

/**
 * Filter component which acts as a container for possible future filter inputs
 * In this case there is no need to use a form, since we have only one input, that also
 * does not have any validation
 * A ui library could also have been used here
 * @param onClear -- A function that will clear the markers from map
 * @param children -- Children inputs will be passed to this component for rendering. Reason for this is to
 * avoid prop drilling effect
 */
const Filter = ({ children, onClear }) => (
  <div>
    {children}
    <button onClick={onClear}>Clear</button>
  </div>
);

Filter.propTypes = {
  children: PropTypes.node.isRequired,
  onClear: PropTypes.func.isRequired,
};

export { Filter };
