import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useMemo, useRef, useState } from "react";
import useMediaQuery from "../hooks/useMediaQuery";
import { isPast, toDate, toneFor } from "../utils/format";
import { byStart, hasClashOn } from "../utils/schedule";
import DayAgenda from "./DayAgenda";
import "./PlannerCalendar.css";

// Kept outside the component: FullCalendar re-renders when an option changes identity.
const PLUGINS = [dayGridPlugin, timeGridPlugin, interactionPlugin];
const TOOLBAR = { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek" };
// phones have no room for the week grid
const TOOLBAR_NARROW = { left: "title", center: "", right: "today prev,next" };
const BUTTON_TEXT = { today: "Today", month: "Month", week: "Week" };
const TIME_FORMAT = { hour: "numeric", minute: "2-digit", omitZeroMinute: true, meridiem: "short" };
const VIEWS = { timeGridWeek: { dayHeaderFormat: { weekday: "short", day: "numeric" } } };
const WEEK_HEIGHT = 640; // scrolls inside, starting at 8am

// Calendar of the events you're going to, with the selected day's events beside it.
export default function PlannerCalendar({
  events,
  communityNames,
  conflicts,
  selectedDay,
  onSelectDay,
  onOpen,
}) {
  const narrow = useMediaQuery("(max-width: 720px)");
  const calendar = useRef(null);
  const [isWeek, setIsWeek] = useState(false);

  const calendarEvents = useMemo(
    () =>
      events.map((event) => ({
        id: String(event.id),
        title: event.title,
        start: toDate(event.start_at),
        end: toDate(event.end_at),
        classNames: [
          `cal-tone-${toneFor(event.community_id)}`,
          conflicts.has(event.id) ? "is-clash" : "",
          isPast(event) ? "is-past" : "",
        ].filter(Boolean),
        extendedProps: { event },
      })),
    [events, conflicts],
  );

  const clashing = useMemo(
    () => events.filter((event) => conflicts.has(event.id)).sort(byStart),
    [events, conflicts],
  );
  // The first day with an overlap, which may be in a month that isn't on screen.
  const firstClashDay = clashing
    .map((event) => toDate(event.start_at))
    .find((date) => hasClashOn(clashing, date));

  // After prev/next, move the selection if that day is no longer on screen.
  const handleDatesSet = ({ view }) => {
    setIsWeek(view.type === "timeGridWeek");
    onSelectDay((day) => {
      if (day >= view.activeStart && day < view.activeEnd) return day;
      const today = new Date();
      return today >= view.currentStart && today < view.currentEnd ? today : view.currentStart;
    });
  };

  const jumpToDay = (day) => {
    onSelectDay(day);
    calendar.current.getApi().gotoDate(day);
  };

  return (
    <div className="planner-calendar">
      <div className="calendar-panel">
        {firstClashDay && (
          <div className="clash-banner" role="status">
            <span className="clash-sign" aria-hidden="true" />
            <span>
              <strong>{clashing.length} events clash.</strong> They overlap in time.
            </span>
            <button className="btn btn-danger btn-sm" onClick={() => jumpToDay(firstClashDay)}>
              Show
            </button>
          </div>
        )}
        <FullCalendar
          // remount when crossing the breakpoint, so a phone never shows the week view
          key={narrow ? "narrow" : "wide"}
          ref={calendar}
          plugins={PLUGINS}
          initialView="dayGridMonth"
          initialDate={selectedDay}
          headerToolbar={narrow ? TOOLBAR_NARROW : TOOLBAR}
          buttonText={BUTTON_TEXT}
          views={VIEWS}
          locale="en-IN" // same date style as utils/format.js
          firstDay={1}
          height={isWeek ? WEEK_HEIGHT : "auto"}
          fixedWeekCount={false}
          allDaySlot={false}
          scrollTime="08:00:00"
          nowIndicator
          dayMaxEvents={narrow ? 2 : 3}
          moreLinkText={narrow ? "" : "more"} // just "+3" on phones
          eventDisplay="block"
          eventInteractive
          eventTimeFormat={TIME_FORMAT}
          events={calendarEvents}
          navLinks
          navLinkHint="Show plans for $0"
          navLinkDayClick={(date) => onSelectDay(date)}
          dateClick={({ date }) => onSelectDay(date)}
          moreLinkClick={({ date }) => {
            onSelectDay(date);
            return "popover";
          }}
          eventClick={({ event }) => {
            onSelectDay(event.start);
            onOpen(event.extendedProps.event);
          }}
          dayCellClassNames={({ date }) =>
            [
              date.toDateString() === selectedDay.toDateString() && "is-selected",
              hasClashOn(clashing, date) && "has-clash",
            ].filter(Boolean)
          }
          // only the week view has a date in each column header
          dayHeaderClassNames={({ date, view }) =>
            view.type === "timeGridWeek" && hasClashOn(clashing, date) ? ["has-clash"] : []
          }
          datesSet={handleDatesSet}
        />
      </div>

      <DayAgenda
        day={selectedDay}
        events={events}
        communityNames={communityNames}
        conflicts={conflicts}
        onOpen={onOpen}
        onJump={jumpToDay}
      />
    </div>
  );
}
