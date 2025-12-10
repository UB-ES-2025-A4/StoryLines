import { render, fireEvent } from "@testing-library/vue";
import FilterBar from "@/components/Shop/FilterBar.vue";

describe("FilterBar.vue", () => {

  test("renderiza todos los filtros", () => {
    const { getByText } = render(FilterBar, {
      props: { currentFilter: "all" }
    });

    expect(getByText("Todos")).toBeTruthy();
    expect(getByText("Globos")).toBeTruthy();
    expect(getByText("Fondos Home")).toBeTruthy();
    expect(getByText("Fondos Perfil")).toBeTruthy();
  });

  test("marca como activo el filtro actual", () => {
    const { container } = render(FilterBar, {
      props: { currentFilter: "globe" }
    });

    const activeBtn = container.querySelector(".filter-button.active");
    expect(activeBtn).not.toBeNull();
    expect(activeBtn.textContent).toContain("Globos");
  });

  test("emite el evento filter-change con el id correcto", async () => {
    const { getByText, emitted } = render(FilterBar, {
      props: { currentFilter: "all" }
    });

    const btn = getByText("Fondos Perfil");
    await fireEvent.click(btn);

    expect(emitted()["filter-change"]).toBeTruthy();
    expect(emitted()["filter-change"][0]).toEqual(["profileBg"]);
  });

});
