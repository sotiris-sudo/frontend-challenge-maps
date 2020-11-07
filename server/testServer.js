import { businesses } from "../src/components/Main/mocks";
import { rest } from "msw";
import { setupServer } from "msw/node";

// handlers that are going to b e used in our test suite
const handlers = [
  rest.get(
    "/-/search?limit=50&location=Berlin%2C+Germany&term=restaurants",
    async (req, res, ctx) => {
      return res(ctx.status(200), ctx.json({ businesses }));
    }
  ),
];

const server = setupServer(...handlers);

export { server };
