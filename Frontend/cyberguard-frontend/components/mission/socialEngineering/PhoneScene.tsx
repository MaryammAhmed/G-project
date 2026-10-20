// Visual metaphor: an incoming call whose caller-ID flickers between a trusted label and the real unknown number.

export default function PhoneScene() {
  return (
    <svg viewBox="0 0 160 160" className="w-40 mx-auto animate-[bob_3s_ease-in-out_infinite]">
      <rect x="55" y="20" width="50" height="100" rx="8" fill="#0F1420" stroke="#A855F7" strokeWidth="2" />
      <circle cx="80" cy="110" r="3" fill="#A855F7" />
      {/* Ringing waves */}
      <circle cx="80" cy="50" r="14" fill="none" stroke="#A855F7" strokeWidth="1.5" className="animate-ping" />
      <circle cx="80" cy="50" r="22" fill="none" stroke="#A855F7" strokeWidth="1" opacity="0.5" className="animate-pulse" />
      {/* Caller ID text */}
      <text x="80" y="70" textAnchor="middle" fontSize="7" fill="#4ADE80" className="animate-pulse">Mr. Davies — IT</text>
      <text x="80" y="82" textAnchor="middle" fontSize="6" fill="#FB4B5B">Unknown Number</text>
    </svg>
  );
}
