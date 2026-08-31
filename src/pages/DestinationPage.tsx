import { useParams } from "react-router";
import { useTrip } from "../app/TripProvider";
import { findStayBySlug, stayHeader } from "../data/derive";
import { WarningNotice } from "../components/WarningNotice";
import { StayHeader } from "../components/destination/StayHeader";
import { StayNav } from "../components/destination/StayNav";
import { LodgingSection } from "../components/destination/LodgingSection";
import { TransferSection } from "../components/destination/TransferSection";
import { ItineraryByDay } from "../components/destination/ItineraryByDay";
import { NotFoundPage } from "./NotFoundPage";
import styles from "./DestinationPage.module.css";

export function DestinationPage() {
  const result = useTrip();
  const { slug } = useParams<{ slug: string }>();

  if (!result.ok) return null;

  const stay = slug ? findStayBySlug(result.trip, slug) : undefined;
  if (!stay) return <NotFoundPage />;

  const info = stayHeader(result.trip.stays, stay.slug);
  if (!info) return <NotFoundPage />;

  return (
    <div className={styles.page}>
      <StayHeader info={info} />
      <StayNav info={info} />
      <LodgingSection lodging={stay.lodging} />
      <TransferSection transfer={stay.transfer} />
      <ItineraryByDay stay={stay} />
      <WarningNotice warnings={stay.warnings} />
    </div>
  );
}
