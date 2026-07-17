type DateRangeFieldsProps = {
  arrivalDate: string;
  departureDate: string;
  minArrival: string;
  maxDeparture?: string;
  onArrivalChange: (value: string) => void;
  onDepartureChange: (value: string) => void;
  onArrivalBlur?: () => void;
  onDepartureBlur?: () => void;
  arrivalError?: string;
  departureError?: string;
  theme?: "dark" | "light";
};

export function DateRangeFields({ arrivalDate, departureDate, minArrival, maxDeparture, onArrivalChange, onDepartureChange, onArrivalBlur, onDepartureBlur, arrivalError, departureError, theme = "light" }: DateRangeFieldsProps) {
  const dark = theme === "dark";
  const labelClass = `grid min-w-0 gap-1.5 text-xs font-black ${dark ? "text-white/75" : "text-zinc-600"}`;
  const inputClass = `min-h-11 w-full max-w-full min-w-0 rounded-lg border px-3 py-2 text-sm font-bold outline-none transition focus:ring-2 ${dark ? "border-white/20 bg-black/35 text-white [color-scheme:dark] focus:border-amber-200 focus:ring-amber-200/20" : "border-zinc-300 bg-zinc-50 text-zinc-950 shadow-sm focus:border-fuchsia-600 focus:ring-fuchsia-100"}`;
  const errorClass = `text-xs font-bold ${dark ? "text-amber-100" : "text-rose-700"}`;

  return (
    <>
      <label className={labelClass}>
        Arrival
        <input data-testid="arrival-date" type="date" required min={minArrival} value={arrivalDate} onChange={(event) => onArrivalChange(event.target.value)} onBlur={onArrivalBlur} aria-invalid={Boolean(arrivalError)} aria-describedby={arrivalError ? "arrival-date-error" : undefined} className={inputClass} />
        {arrivalError ? <span id="arrival-date-error" className={errorClass}>{arrivalError}</span> : null}
      </label>
      <label className={labelClass}>
        Departure
        <input data-testid="departure-date" type="date" required min={arrivalDate || minArrival} max={maxDeparture} value={departureDate} onChange={(event) => onDepartureChange(event.target.value)} onBlur={onDepartureBlur} aria-invalid={Boolean(departureError)} aria-describedby={departureError ? "departure-date-error" : undefined} className={inputClass} />
        {departureError ? <span id="departure-date-error" className={errorClass}>{departureError}</span> : null}
      </label>
    </>
  );
}
