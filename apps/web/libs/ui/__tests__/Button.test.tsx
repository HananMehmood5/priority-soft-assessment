import { render, screen } from "@testing-library/react";
import { Button } from "../Button";

describe("Button", () => {
  it("renders label", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("shows loading text when loading", () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});

