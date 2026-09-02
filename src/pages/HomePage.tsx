import { todayCalendarDate } from "../data/calendar";
import { countdownState, orderedStays, tripDuration } from "../data/derive";
import { useTrip } from "../app/TripProvider";
import { CountdownBanner } from "../components/home/CountdownBanner";
import { Timeline } from "../components/home/Timeline";
import { RouteMap } from "../components/home/RouteMap";
import { ConsolidatedChecklist } from "../components/home/ConsolidatedChecklist";
import { GeneralItems } from "../components/home/GeneralItems";
import styles from "./HomePage.module.css";

export function HomePage() {
  const result = useTrip();
  if (!result.ok) return null;
  const { trip } = result;

  const ordered = orderedStays(trip.stays);
  const duration = tripDuration(trip.stays);
  const countdown = countdownState(trip, todayCalendarDate());

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Roteiro de fim de ano</p>
        <h1>{trip.title}</h1>
        <CountdownBanner state={countdown} />
      </header>

      <Timeline stays={ordered} totalDuration={duration} />
      <RouteMap stays={trip.stays} />
      <ConsolidatedChecklist trip={trip} />
      <GeneralItems items={trip.generalItems} />
    </div>
  );
}
