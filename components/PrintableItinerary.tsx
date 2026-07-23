import { calculateTripBudget, formatCostRange } from "@/lib/trip-budget";
import { TripDates, TripPick, TripSettings } from "@/types/directory";
import { ItineraryDay } from "@/types/planner";

function dateLabel(dates: TripDates) {
  if (!dates.arrivalDate || !dates.departureDate) return "Dates not set";
  const formatter = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });
  return `${formatter.format(new Date(`${dates.arrivalDate}T00:00:00`))} to ${formatter.format(new Date(`${dates.departureDate}T00:00:00`))}`;
}

export function PrintableSavedTrip({ items, dates, settings }: { items: TripPick[]; dates: TripDates; settings: TripSettings }) {
  const budget = calculateTripBudget(items, settings, dates);
  return (
    <section className="print-document">
      <p className="print-brand">ExperienceVegas</p>
      <h1>My Vegas Itinerary</h1>
      <p>{dateLabel(dates)} / {settings.partySize} traveler{settings.partySize === 1 ? "" : "s"}</p>
      <div className="print-summary">
        <strong>Working estimate: {formatCostRange(budget.total)}</strong>
        <span>Stay {formatCostRange(budget.categories.Stay)}</span>
        <span>Tickets {formatCostRange(budget.categories.Tickets)}</span>
        <span>Food {formatCostRange(budget.categories.Food)}</span>
        <span>Experiences {formatCostRange(budget.categories.Experiences)}</span>
      </div>
      <ol>
        {items.filter((item) => item.status !== "backup").map((item) => (
          <li key={item.id}>
            <div>
              <strong>{item.name}</strong>
              <span>{item.category} / {item.area} / {item.status || "considering"}</span>
            </div>
            <span>{item.priceLabel}</span>
          </li>
        ))}
      </ol>
      <p className="print-note">Estimates exclude taxes, fees, transportation, shopping, and gambling. Confirm schedules and prices before booking.</p>
    </section>
  );
}

export function PrintableGeneratedPlan({ title, days }: { title: string; days: ItineraryDay[] }) {
  return (
    <section className="print-document">
      <p className="print-brand">ExperienceVegas</p>
      <h1>{title}</h1>
      {days.map((day) => (
        <section key={day.date} className="print-day">
          <h2>{day.label}</h2>
          <p>{day.theme}</p>
          <ol>
            {day.blocks.map((block) => (
              <li key={`${day.date}-${block.time}-${block.title}`}>
                <time>{block.time}</time>
                <div>
                  <strong>{block.title}</strong>
                  <span>{[block.location, block.durationMinutes ? `${block.durationMinutes} min` : undefined, block.priceHint].filter(Boolean).join(" / ")}</span>
                  {block.description ? <p>{block.description}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
      <p className="print-note">Schedules, prices, restaurant hours, and availability can change. Confirm details before booking.</p>
    </section>
  );
}
