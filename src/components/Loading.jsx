// מסך טעינה ממותג — לוגו דביק במקום טקסט יבש.
export default function Loading({ label = "טוען…" }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6">
      <img
        src="/logo.png"
        alt="דביק תעשיות — שדה בוקר"
        className="h-16 w-auto animate-pulse"
      />
      <p className="text-slate-400 text-sm">{label}</p>
    </div>
  );
}
