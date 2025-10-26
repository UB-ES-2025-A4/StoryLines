<template>
  <div class="photo-adjuster">
    <h1 class="photo-title">Selecciona y Ajusta tu Fotografía</h1>
    <input type="file" @change="onFileChange" accept="image/*" />

    <div class="canvas-container">
      <canvas
        ref="canvas"
        width="300"
        height="300"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="stopDrag"
        @mouseleave="stopDrag"
        @wheel.prevent="onZoom"
      ></canvas>
    </div>

    <div class="buttons">
      <button @click="uploadImage" :disabled="loading">
        {{ loading ? "Subiendo..." : "Subir Imagen" }}
      </button>
      <button @click="deleteImage" :disabled="loading">
        Eliminar Imagen
      </button>
    </div>

    <p v-if="success" class="success">{{ success }}</p>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { supabase } from "@/config/supabase";

export default {
  name: "CirclePhoto",
  setup(props, { emit }) {
    const API_URL = "http://localhost:3000";
    const canvas = ref(null);
    const img = ref(null);
    const isDragging = ref(false);
    const startX = ref(0);
    const startY = ref(0);
    const offsetX = ref(0);
    const offsetY = ref(0);
    const scale = ref(1);
    const baseScale = ref(1);

    const loading = ref(false);
    const error = ref("");
    const success = ref("");
    const user = ref(null);

    onMounted(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      user.value = session?.user;
      if (!user.value) {
        error.value = "No hay sesión activa. Inicia sesión.";
      }
    });

    const onFileChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const image = new Image();
        image.onload = () => {
          img.value = image;
          const ctx = canvas.value.getContext("2d");
          baseScale.value = Math.max(
            canvas.value.width / image.width,
            canvas.value.height / image.height
          );
          scale.value = baseScale.value;
          offsetX.value = (canvas.value.width - image.width * scale.value) / 2;
          offsetY.value = (canvas.value.height - image.height * scale.value) / 2;
          drawImage(ctx);
        };
        image.src = event.target.result;
      };
      reader.readAsDataURL(file);
    };

    const drawImage = (ctx) => {
      ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
      ctx.save();
      ctx.beginPath();
      ctx.arc(150, 150, 150, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      if (img.value) {
        ctx.drawImage(
          img.value,
          offsetX.value,
          offsetY.value,
          img.value.width * scale.value,
          img.value.height * scale.value
        );
      }
      ctx.restore();

      ctx.beginPath();
      ctx.arc(150, 150, 150, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
    };

    const startDrag = (e) => {
      if (!img.value) return;
      isDragging.value = true;
      startX.value = e.offsetX - offsetX.value;
      startY.value = e.offsetY - offsetY.value;
      canvas.value.style.cursor = "grabbing";
    };

    const onDrag = (e) => {
      if (isDragging.value) {
        offsetX.value = e.offsetX - startX.value;
        offsetY.value = e.offsetY - startY.value;
        drawImage(canvas.value.getContext("2d"));
      }
    };

    const stopDrag = () => {
      isDragging.value = false;
      canvas.value.style.cursor = "grab";
    };

    const onZoom = (e) => {
      if (!img.value) return;
      const zoomSpeed = 0.1;
      const zoom = e.deltaY < 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
      scale.value *= zoom;
      drawImage(canvas.value.getContext("2d"));
    };

    const uploadImage = async () => {
  error.value = "";
  success.value = "";

  if (!img.value) {
    error.value = "Por favor, selecciona una imagen antes de subirla.";
    return;
  }

  loading.value = true;

  try {
    // Convertir el canvas a blob y luego a Base64
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = 300;
    outputCanvas.height = 300;
    const ctx = outputCanvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(150, 150, 150, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(
      img.value,
      offsetX.value,
      offsetY.value,
      img.value.width * scale.value,
      img.value.height * scale.value
    );

    const blob = await new Promise((resolve) => outputCanvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("No se pudo generar la imagen");

    const base64 = await blobToBase64(blob); // función helper

    // Llamada al backend
    const res = await fetch(`${API_URL}/api/upload-avatar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.value.id, imageBase64: base64 }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error subiendo la imagen");

    success.value = "Imagen actualizada correctamente!";
    emit("image-updated", data.avatar_url);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// helper
const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });



  const deleteImage = async () => {
  if (!user.value) return;
  loading.value = true;
  error.value = "";
  success.value = "";

  try {
    const res = await fetch(`${API_URL}/api/delete-avatar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.value.id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error eliminando la imagen");

    img.value = null;
    const ctx = canvas.value.getContext("2d");
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

    success.value = "Imagen eliminada correctamente!";
    emit("image-updated", null);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};


    return {
      canvas,
      onFileChange,
      startDrag,
      onDrag,
      stopDrag,
      onZoom,
      uploadImage,
      deleteImage,
      loading,
      error,
      success,
    };
  },
};
</script>

<style scoped>
.photo-adjuster {
  font-family: Arial, sans-serif;
  background: #f2f2f251;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
}

h1 {
  color: #ffffff;
}

.photo-title {
  font-size: 1.9rem;
  font-weight: 500;
  margin-bottom: 10px;
}

.canvas-container {
  position: relative;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  overflow: hidden;
  background: #e6e3e3;
  cursor: grab;
  margin-top: 20px;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
}

input[type="file"] {
  margin-top: 20px;
}

.buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #fdfdfd;
  color: rgb(0, 0, 0);
  font-size: 16px;
  cursor: pointer;
}

button:hover:not(:disabled) {
  background-color: rgb(194, 194, 194);
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error {
  color: red;
  margin: 1rem 0;
}

.success {
  color: green;
  margin: 1rem 0;
}
</style>
