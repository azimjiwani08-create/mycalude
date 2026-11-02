import type { StaticImageData } from "next/image";
import cafe from "@/assets/scenes/cafe.jpg";
import garden from "@/assets/scenes/garden.jpg";
import loginPlaceholder from "@/assets/scenes/login-placeholder.jpg";
import seaFace from "@/assets/scenes/sea-face.jpg";
import shops from "@/assets/scenes/shops.jpg";
import street from "@/assets/scenes/street.jpg";

/*
 * PLACEHOLDERS. These are crops of the prototype portraits' backgrounds, with shop
 * signs blurred so no real business reads as a partner. Replace them with real,
 * consented or licensed photos of partner venues before any real user sees the app.
 * Swap the file; nothing else changes.
 */
export type Scene = { image: StaticImageData; alt: string };

export const scenes = {
  seaFace: { image: seaFace, alt: "The sky at sunset over a city sea-face" },
  cafe: { image: cafe, alt: "A bright cafe with hanging plants and a view of trees" },
  street: { image: street, alt: "A tree-lined city street with shops, softly out of focus" },
  shops: { image: shops, alt: "A row of brick shopfronts, softly out of focus" },
  garden: { image: garden, alt: "A green public garden with a stone path" },
} satisfies Record<string, Scene>;

export type SceneKey = keyof typeof scenes;

export const loginScene: Scene = {
  image: loginPlaceholder,
  alt: "A warm, softly out-of-focus cafe in a public place",
};
