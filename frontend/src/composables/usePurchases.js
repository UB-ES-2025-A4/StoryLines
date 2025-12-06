import { ref, computed } from "vue";
import { useBalance } from "./useBalance";
import { DEFAULT_ITEMS } from "@/data/shopThemes";
import { supabase } from "@/config/supabase";

const purchasedItems = ref([]);
let initialized = false;

export function usePurchases() {
  const { deductBalance, hasEnoughBalance, loadBalance } = useBalance();


  async function initialize(userId) {
  // 🔥 SIEMPRE reiniciar compras al entrar con otro usuario
  initialized = false;
  purchasedItems.value = [];
  
  // Asegurar ítems default para el usuario
  await fetch(`/api/default-items/${userId}`);


  // cargar items del backend
  const res = await fetch(`/api/purchases/${userId}`);
  const data = await res.json();

  const backendItems = data.items || [];

  // defaults siempre
  const defaults = Object.values(DEFAULT_ITEMS);

  purchasedItems.value = [...new Set([...backendItems, ...defaults])];

  initialized = true;  // se marca aquí
}

  function isPurchased(itemId) {
    return purchasedItems.value.includes(itemId);
  }

  async function purchaseItem(item, userId) {
    if (isPurchased(item.id)) {
      return { success: false, message: "Ya comprado", type: "error" };
    }

    if (!hasEnoughBalance(item.price)) {
      return { success: false, message: "Saldo insuficiente", type: "error" };
    }

    // Llamada al backend
    const res = await fetch(`/api/purchases/buy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, itemId: item.id }),
    });

    const data = await res.json();

    if (!data.ok) {
      return { success: false, message: data.error, type: "error" };
    }

    // 1️⃣ Añade el item a la lista
    purchasedItems.value.push(item.id);

    // 2️⃣ Recarga el balance desde Supabase (NO RESTAR LOCALMENTE)
    await loadBalance();

    return {
      success: true,
      message: `Compraste ${item.name}`,
      type: "success",
    };
  }


  return {
    purchasedItems,
    isPurchased,
    purchaseItem,
    initialize,
  };
}
