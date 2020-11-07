import React from "react";
import Main from "./index";
import { render, screen } from "@testing-library/react";
import { server } from "../../../server/testServer";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("should render <Main/>", () => {
  const { container } = render(<Main />);
  expect(container).toBeInTheDocument();
});

test("should render restaurant cards", async () => {
  render(<Main />);
  expect(await screen.findByTestId("restaurantCard")).toBeInTheDocument();
});
