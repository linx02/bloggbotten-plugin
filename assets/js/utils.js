export function getNextScheduledDate(currentDate, scheduleDays) {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayIndex = currentDate.getDay();
    const scheduleDayIndices = scheduleDays.map(day => dayNames.indexOf(day.toLowerCase())).sort((a, b) => a - b);

    for (const dayIndex of scheduleDayIndices) {
        if (dayIndex > currentDayIndex) {
            const nextDate = new Date(currentDate);
            nextDate.setDate(currentDate.getDate() + (dayIndex - currentDayIndex));
            return nextDate;
        }
    }

    // Loop to next week if no future day found this week
    const nextWeekDate = new Date(currentDate);
    nextWeekDate.setDate(currentDate.getDate() + (7 - currentDayIndex + scheduleDayIndices[0]));
    return nextWeekDate;
}

export function confirmExit() {
    const wrap = document.querySelector('.wrap');
    const modal = document.createElement('div');

    modal.classList.add('modal');
    modal.innerHTML = `
        <div class="modal-content">
            <p>Du har osparade ändringar, om du lämnar sidan går dessa förlorade och även eventuella krediter du spenderat</p>
            <button id="exit-yes">Bekräfta</button>
            <button id="exit-no">Stanna</button>
        </div>
    `;

    wrap.appendChild(modal);

    return new Promise((resolve) => {
        document.getElementById('exit-yes').addEventListener('click', () => {
            modal.remove();
            resolve(true);
        });
        document.getElementById('exit-no').addEventListener('click', () => {
            modal.remove();
            resolve(false);
        });
    });
}