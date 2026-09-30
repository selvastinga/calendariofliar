document.addEventListener('DOMContentLoaded', () => {
  const calendarEl = document.getElementById('calendar');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDate = document.getElementById('modal-date');
  const modalLocation = document.getElementById('modal-location');
  const modalDescription = document.getElementById('modal-description');
  const modalClose = document.getElementById('modal-close');

  function closeModal() {
    modal.classList.add('hidden');
  }
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'es',
    height: 'auto',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,listMonth',
    },
    events: async (info, successCallback, failureCallback) => {
      try {
        const res = await fetch('/api/events');
        const eventos = await res.json();
        successCallback(
          eventos.map((ev) => ({
            id: ev.id,
            title: ev.title,
            start: ev.event_date,
            extendedProps: {
              location: ev.location,
              description: ev.description,
            },
          }))
        );
      } catch (err) {
        failureCallback(err);
      }
    },
    eventClick: (info) => {
      const { title, start, extendedProps } = info.event;
      modalTitle.textContent = title;
      modalDate.textContent = '🕒 ' + start.toLocaleString('es-AR');
      modalLocation.textContent = extendedProps.location ? '📍 ' + extendedProps.location : '';
      modalDescription.textContent = extendedProps.description || '';
      modal.classList.remove('hidden');
    },
  });

  calendar.render();
});
