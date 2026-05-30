import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SegmentedControl } from "../src/components/SegmentedControl.tsx";

const OPTIONS = [
  { value: "corto", label: "Corto" },
  { value: "largo", label: "Largo" },
] as const;

describe("SegmentedControl", () => {
  it("renders the option labels", () => {
    render(
      <SegmentedControl
        legend="Duración"
        name="duracion"
        options={OPTIONS}
        value="corto"
        onChange={() => {}}
      />,
    );

    expect(screen.getByText("Corto")).toBeInTheDocument();
    expect(screen.getByText("Largo")).toBeInTheDocument();
  });

  it("fires onChange with the value of the clicked (unselected) option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SegmentedControl
        legend="Duración"
        name="duracion"
        options={OPTIONS}
        value="corto"
        onChange={onChange}
      />,
    );

    // "corto" is already selected; clicking it fires no change event on a
    // controlled radio. Click the unselected "Largo" so onChange actually runs.
    await user.click(screen.getByText("Largo"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("largo");
  });
});
