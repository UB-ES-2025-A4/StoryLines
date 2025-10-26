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
    </div>
  </template>
  
  <script>
  import { ref } from "vue";
  
  export default {
    name: "CirclePhoto",
    setup() {
      const canvas = ref(null);
      const img = ref(null);
      const isDragging = ref(false);
      const startX = ref(0);
      const startY = ref(0);
      const offsetX = ref(0);
      const offsetY = ref(0);
      const scale = ref(1);
      const baseScale = ref(1);
  
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
  
      return {
        canvas,
        onFileChange,
        startDrag,
        onDrag,
        stopDrag,
        onZoom,
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
  </style>
  