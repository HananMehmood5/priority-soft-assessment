import { render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { ShiftsListContainer } from "../ShiftsListContainer";
import { SHIFTS_QUERY, LOCATIONS_QUERY } from "@/lib/apollo/operations";

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

const mocks = [
  {
    request: { query: SHIFTS_QUERY },
    result: { data: { shifts: [] } },
  },
  {
    request: { query: LOCATIONS_QUERY },
    result: { data: { locations: [] } },
  },
];

describe("ShiftsListContainer", () => {
  it("renders loading then empty state", async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ShiftsListContainer />
      </MockedProvider>
    );
    expect(screen.getByText(/Loading shifts/i)).toBeInTheDocument();
    const empty = await screen.findByText(/No shifts\. Create one to get started\./i);
    expect(empty).toBeInTheDocument();
  });
});
