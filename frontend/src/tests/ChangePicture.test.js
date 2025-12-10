import { render, fireEvent, waitFor } from "@testing-library/vue";
import ChangePicture from "@/components/Profile/ChangePicture.vue";
import { vi } from "vitest";

/* ---------------------------------------------------------
   MOCK SUPABASE
--------------------------------------------------------- */
vi.mock("@/config/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({
          data: { session: { user: { id: "USER1" } } }
        })
      )
    }
  }
}));

/* ---------------------------------------------------------
   MOCK FETCH
--------------------------------------------------------- */
global.fetch = vi.fn();

/* ---------------------------------------------------------
   MOCK CANVAS — ESTABLE Y COMPLETO
--------------------------------------------------------- */
Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  value: () => ({
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    clip: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    stroke: vi.fn()
  })
});

HTMLCanvasElement.prototype.toBlob = function (cb) {
  cb(new Blob(["mock"], { type: "image/png" }));
};

/* ---------------------------------------------------------
   MOCK Image — EJECUTA SIEMPRE onload()
--------------------------------------------------------- */
class MockImage {
  constructor() {
    this.onload = null;
    this.width = 400;
    this.height = 400;
  }
  set src(v) {
    Promise.resolve().then(() => this.onload && this.onload());
  }
}
vi.stubGlobal("Image", MockImage);

/* ---------------------------------------------------------
   Helper: seleccionar imagen (fireEvent.update)
--------------------------------------------------------- */
async function selectImage() {
  const input = document.querySelector("input[type='file']");
  const file = new File(["aaa"], "test.png", { type: "image/png" });

  await fireEvent.update(input, { files: [file] });
}

/* ---------------------------------------------------------
   TESTS
--------------------------------------------------------- */
describe("ChangePicture.vue", () => {
  beforeEach(() => vi.clearAllMocks());

  test("dibuja la imagen (ejecuta onload) al seleccionar archivo", async () => {
    render(ChangePicture);

    await selectImage();

    await waitFor(() => {
      expect(document.querySelector("canvas")).not.toBeNull();
    });
  });

  test("permite hacer zoom sin errores", async () => {
    render(ChangePicture);

    await selectImage();

    const canvas = document.querySelector("canvas");
    canvas.dispatchEvent(new WheelEvent("wheel", { deltaY: -100 }));
  });



  test("uploadImage muestra error si no hay imagen seleccionada", async () => {
    const { findByText } = render(ChangePicture);

    const uploadBtn = document.querySelectorAll("button")[0];
    await fireEvent.click(uploadBtn);

    expect(
      await findByText("Por favor, selecciona una imagen antes de subirla.")
    ).toBeTruthy();
  });

  test("deleteImage llama al endpoint correctamente", async () => {
    render(ChangePicture);

    await selectImage();

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true })
    });

    const deleteBtn = document.querySelectorAll("button")[1];
    await fireEvent.click(deleteBtn);

    await waitFor(() => expect(fetch).toHaveBeenCalled());
  });
});
