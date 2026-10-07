import CyberBackground from "@/components/game/CyberBackground";
import Stage from "@/components/game/Stage";
import Maya from "@/components/game/Maya";
import DialogueBox from "@/components/game/DialogueBox";

export default function DesignTestPage() {
  return (
    <CyberBackground>
      <Stage>
        {/* Top-left game title */}
        <div className="absolute left-6 top-6 z-40">
          <p className="text-xs uppercase tracking-[0.4em] text-electric-blue">
            CyberGuard
          </p>

          <h1 className="mt-1 text-2xl font-bold text-text-primary">
            The Mirage
          </h1>
        </div>

        {/* Maya + dialogue */}
        <div className="flex h-full items-end justify-center gap-0 pb-8 md:gap-0">
          
          {/* Character */}
          <Maya mood="idle" />

          {/* Dialogue overlaps Maya slightly */}
          <div className="z-20 mb-[12vh] w-full max-w-xl -ms-16 px-4">
            <DialogueBox
              speaker="Maya"
              text="Something isn't right. A message just appeared on your screen."
            >
              <button
                className="
                  rounded-lg
                  bg-electric-blue/20
                  px-5
                  py-2
                  text-sm
                  font-semibold
                  text-electric-blue
                  transition
                  hover:bg-electric-blue/30
                "
              >
                Continue
              </button>
            </DialogueBox>
          </div>

        </div>
      </Stage>
    </CyberBackground>
  );
}
