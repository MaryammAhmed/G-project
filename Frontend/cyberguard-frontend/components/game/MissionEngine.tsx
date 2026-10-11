"use client"; // CHANGED: must be the first line of the file

import { useState } from "react";
import type { CSSProperties } from "react"; // NEW: for the --c colour variable
import DialogueBox from "@/components/game/DialogueBox"; // CHANGED: moved below "use client", named DialogueBox
import type {
  Scenario,
  Beat,
  Localized,
} from "@/types/game";

/* NEW: who is speaking. The Beat type has no speaker field yet, so it is one
   constant. Change "Nyx" to "Maya" if that is who this episode uses. */
const SPEAKER_NAME = "Nyx";

interface MissionEngineProps {
  scenario: Scenario;
  lang?: "en" | "ar";
}

export default function MissionEngine({
  scenario,
  lang = "en",
}: MissionEngineProps) {
  const [beatIndex, setBeatIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [revealedClues, setRevealedClues] = useState<string[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [lineDone, setLineDone] = useState(false); // NEW: true once the dialogue line has finished typing

  const beat: Beat | undefined = scenario.beats[beatIndex];

  const text = (value: Localized) => value[lang];

  if (!beat) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Episode Complete</h1>

        <p>
          Story complete. Score: {score}
        </p>

        <p>
          Hands-on tasks will appear here next.
        </p>
      </main>
    );
  }

  function nextBeat() {
    setBeatIndex((current) => current + 1);
    setRevealedClues([]);
    setSelectedChoice(null);
    setLineDone(false); // NEW: the next dialogue line starts unfinished
  }

  function revealClue(id: string) {
    setRevealedClues((current) =>
      current.includes(id)
        ? current
        : [...current, id]
    );
  }

  function chooseAnswer(
    choiceId: string,
    points: number
  ) {
    setSelectedChoice(choiceId);
    setScore((current) => current + points);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 40,
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      {/* Progress */}
      <div style={{ marginBottom: 30 }}>
        <p>
          Episode: {scenario.title[lang]}
        </p>

        <p>
          Beat {beatIndex + 1} / {scenario.beats.length}
        </p>

        <p>
          Score: {score}
        </p>
      </div>

      {/* Dialogue */}
      {beat.type === "dialogue" && (
        <section>
          <h2>Story</h2>

          {/* CHANGED: the plain <p> is now the DialogueBox.
              The wrapper sets --c, the accent colour the box uses
              for its border and name tag. */}
          <div
            style={{ "--c": "#4cc9ff" } as CSSProperties}
            dir={lang === "ar" ? "rtl" : "ltr"}
          >
            <DialogueBox
              key={beatIndex} // NEW: fresh typewriter for every beat
              speakerName={SPEAKER_NAME}
              dialogueText={text(beat.text)}
              onTypingDone={() => setLineDone(true)}
            />
          </div>

          <button
            onClick={nextBeat}
            disabled={!lineDone} // NEW: Continue unlocks when the line is fully shown
            style={{ marginTop: 20 }}
          >
            Continue
          </button>
        </section>
      )}

      {/* Investigation */}
      {beat.type === "investigate" && (
        <section>
          <h2>Investigate</h2>

          <p style={{ fontSize: 20 }}>
            {text(beat.prompt)}
          </p>

          <div style={{ marginTop: 30 }}>
            {beat.clues.map((clue) => {
              const revealed =
                revealedClues.includes(clue.id);

              return (
                <div
                  key={clue.id}
                  style={{
                    border: "1px solid #555",
                    padding: 20,
                    marginBottom: 15,
                  }}
                >
                  <button
                    onClick={() =>
                      revealClue(clue.id)
                    }
                  >
                    {text(clue.label)}
                  </button>

                  {revealed && (
                    <p>
                      {text(clue.reveal)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <button
            disabled={
              revealedClues.length !==
              beat.clues.length
            }
            onClick={nextBeat}
          >
            Continue
          </button>
        </section>
      )}

      {/* Decision */}
      {beat.type === "decision" && (
        <section>
          <h2>Decision</h2>

          <p style={{ fontSize: 24 }}>
            {text(beat.prompt)}
          </p>

          <div style={{ marginTop: 30 }}>
            {beat.choices.map((choice) => {
              const selected =
                selectedChoice === choice.id;

              return (
                <div
                  key={choice.id}
                  style={{
                    border: "1px solid #555",
                    padding: 20,
                    marginBottom: 15,
                  }}
                >
                  <button
                    onClick={() =>
                      chooseAnswer(
                        choice.id,
                        choice.points
                      )
                    }
                    disabled={selectedChoice !== null}
                  >
                    {text(choice.label)}
                  </button>

                  {selected && (
                    <>
                      <p>
                        {text(choice.consequence)}
                      </p>

                      <p>
                        {choice.correct
                          ? "Correct."
                          : "Not quite."}
                      </p>

                      <button onClick={nextBeat}>
                        Continue
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
