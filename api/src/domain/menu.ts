export interface NormalizedMenu {
  pizzeriaId: string;
  sizes: { id: string; label: string; priceAgorot: number }[];
  crusts: { id: string; label: string; priceAgorot: number }[];
  sauces: string[];
  toppings: { id: string; name: string; priceAgorot: number }[];
}
