document.addEventListener('DOMContentLoaded', () => {
  const calendarEl = document.getElementById('calendar');
  const modal = document.getElementById('modal');
  const viewMode = document.getElementById('view-mode');
  const modalTitle = document.getElementById('modal-title');
  const modalDate = document.getElementById('modal-date');
  const modalLocation = document.getElementById('modal-location');
  const modalDescription = document.getElementById('modal-description');
  const modalClose = document.getElementById('modal-close');
  const btnEdit = document.getElementById('btn-edit');
  const btnDelete = document.getElementById('btn-delete');
  const editForm = document.getElementById('edit-form');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  const editTitle = document.getElementById('edit-title');
  const editDatetime = document.getElementById('edit-datetime');
  const editLocation = document.getElementById('edit-location');
  const editDescription = document.getElementById('edit-description');

  const dayModal = document.getElementById('day-modal');
  const dayModalClose = document.getElementById('day-modal-close');
  const dayModalTitle = document.getElementById('day-modal-title');
  const dayEventsList = document.getElementById('day-events-list');
  const dayEventsEmpty = document.getElementById('day-events-empty');

  let currentEvent = null;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function toDateStr(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function toDatetimeLocalValue(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function showViewMode() {
    viewMode.classList.remove('hidden');
    editForm.classList.add('hidden');
  }

  function closeModal() {
    modal.classList.add('hidden');
    currentEvent = null;
  }
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  function closeDayModal() {
    dayModal.classList.add('hidden');
  }
  dayModalClose.addEventListener('click', closeDayModal);
  dayModal.addEventListener('click', (e) => {
    if (e.target === dayModal) closeDayModal();
  });

  function openEventModal(event) {
    currentEvent = event;
    showViewMode();
    modalTitle.textContent = event.title;
    modalDate.textContent = '🕒 ' + event.start.toLocaleString('es-AR');
    modalLocation.textContent = event.extendedProps.location ? '📍 ' + event.extendedProps.location : '';
    modalDescription.textContent = event.extendedProps.description || '';
    modal.classList.remove('hidden');
  }

  btnEdit.addEventListener('click', () => {
    if (!currentEvent) return;
    editTitle.value = currentEvent.title;
    editDatetime.value = toDatetimeLocalValue(currentEvent.start);
    editLocation.value = currentEvent.extendedProps.location || '';
    editDescription.value = currentEvent.extendedProps.description || '';
    viewMode.classList.add('hidden');
    editForm.classList.remove('hidden');
  });

  btnCancelEdit.addEventListener('click', () => {
    showViewMode();
  });

  btnDelete.addEventListener('click', async () => {
    if (!currentEvent) return;
    if (!confirm(`¿Borrar el evento "${currentEvent.title}"?`)) return;
    const res = await fetch(`/api/events/${currentEvent.id}`, { method: 'DELETE' });
    if (res.ok) {
      calendar.refetchEvents();
      closeModal();
    } else {
      alert('No se pudo borrar el evento.');
    }
  });

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentEvent) return;
    const payload = {
      title: editTitle.value.trim(),
      eventDate: new Date(editDatetime.value).toISOString(),
      location: editLocation.value.trim() || null,
      description: editDescription.value.trim() || null,
    };
    const res = await fetch(`/api/events/${currentEvent.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      calendar.refetchEvents();
      closeModal();
    } else {
      alert('No se pudo guardar el evento.');
    }
  });

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'es',
    height: 'auto',
    dayMaxEvents: true,
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
      openEventModal(info.event);
    },
    dateClick: (info) => {
      const eventosDelDia = calendar
        .getEvents()
        .filter((ev) => toDateStr(ev.start) === info.dateStr)
        .sort((a, b) => a.start - b.start);

      dayModalTitle.textContent = info.date.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      dayEventsList.innerHTML = '';
      dayEventsEmpty.classList.toggle('hidden', eventosDelDia.length > 0);

      eventosDelDia.forEach((ev) => {
        const li = document.createElement('li');
        li.className = 'day-event-item';
        const hora = ev.start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        li.innerHTML = `<span class="day-event-time">${hora}</span><span class="day-event-title">${ev.title}</span>${ev.extendedProps.location ? `<span class="day-event-location">📍 ${ev.extendedProps.location}</span>` : ''}`;
        li.addEventListener('click', () => {
          closeDayModal();
          openEventModal(ev);
        });
        dayEventsList.appendChild(li);
      });

      dayModal.classList.remove('hidden');
    },
  });

  calendar.render();
});
