import Image from "next/image";
import { characterImages, CharacterMood } from "@/config/character";

interface MayaProps {
  mood?: CharacterMood;
}

export default function Maya({ mood = "idle" }: MayaProps) {
  const src = characterImages[mood];

  return (
    /* h-[80vh]: much bigger, so she is the focus of the scene.
       Sized by HEIGHT so she fits any screen. */
    <div className="relative h-[80vh] max-h-[900px] animate-[bob_6s_ease-in-out_infinite]">

      {/* Colored light BEHIND her: the "aura" that ties her to the scene */}
      <div className="pointer-events-none absolute inset-x-0 top-1/4 z-0 mx-auto h-1/2 w-full rounded-full bg-maya-red/30 blur-3xl" />

      {/* MAIN IMAGE
          Two stacked drop-shadows act as RIM LIGHT:
          cyan from the environment + violet from the sky.
          This is what makes her lighting match the background. */}
      <Image
        src={src}
        alt="Maya, the CyberGuard"
        width={500}
        height={900}
        priority
        className="relative z-10 h-full w-auto object-contain
          drop-shadow-[0_0_18px_rgba(76,201,255,0.35)]
          drop-shadow-[0_10px_30px_rgba(139,92,246,0.35)]"
      />

      {/* FLOOR REFLECTION
          The same image, flipped upside down and placed under her feet.
          The mask fades it out quickly so it looks like a glossy floor. */}
      <Image
        src={src}
        alt=""
        aria-hidden
        width={500}
        height={900}
        className="pointer-events-none absolute left-1/2 top-full z-0 h-full w-auto
          -translate-x-1/2 -scale-y-100 object-contain opacity-25
          [mask-image:linear-gradient(to_bottom,black,transparent_35%)]"
      />
    </div>
  );
}
