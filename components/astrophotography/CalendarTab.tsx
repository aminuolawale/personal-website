const CALENDAR_EMBED_URL =
  "https://calendar.google.com/calendar/embed" +
  "?src=65fc31ff0683c8c738a8324e9fc397a558af6e82cda10d3e1bd785b90b9eeddc%40group.calendar.google.com" +
  "&ctz=Europe%2FZurich";

export default function CalendarTab() {
  return (
    <div className="w-full overflow-x-auto">
      <iframe
        src={CALENDAR_EMBED_URL}
        title="Astrophotography session calendar"
        width="800"
        height="600"
        className="max-w-full"
        style={{ border: 0, colorScheme: "normal" }}
        frameBorder={0}
        scrolling="no"
      />
    </div>
  );
}
