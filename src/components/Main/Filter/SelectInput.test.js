import React from "react";
import { SelectInput } from "./";
import { render, screen, fireEvent } from "@testing-library/react";

test("should render<SelectInput/>", () => {
  const { container } = render(<SelectInput onChange={jest.fn()} value="" />);
  expect(container).toBeInTheDocument();
});

test("should have a select input", () => {
  render(<SelectInput onChange={jest.fn()} value="" />);
  const input = screen.getByRole("combobox");
  expect(input).toBeInTheDocument();
});

test("should have 4 options", () => {
  render(<SelectInput onChange={jest.fn()} value="" />);
  const options = screen.getAllByRole("option");

  expect(options.length).toBe(4);
});

test("should render the correct text for options", () => {
  render(<SelectInput onChange={jest.fn()} value="" />);

  expect(screen.getByText("--Please choose an option--")).toBeInTheDocument();
  expect(screen.getByText("Burger")).toBeInTheDocument();
  expect(screen.getByText("Sushi")).toBeInTheDocument();
  expect(screen.getByText("Pizza")).toBeInTheDocument();
});

test("should render the correct value for options", () => {
  render(<SelectInput onChange={jest.fn()} value="" />);

  expect(screen.getByText("--Please choose an option--").value).toBe("");
  expect(screen.getByText("Burger").value).toBe("burgers");
  expect(screen.getByText("Sushi").value).toBe("sushi");
  expect(screen.getByText("Pizza").value).toBe("pizza");
});

test("should call onChange", () => {
  const handleChange = jest.fn();

  render(<SelectInput onChange={handleChange} value="" />);

  fireEvent.change(screen.getByRole("combobox"));

  expect(handleChange).toHaveBeenCalledTimes(1);
});
