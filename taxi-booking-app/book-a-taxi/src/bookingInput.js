export const parseDate = (dateString, today = new Date()) => {
    if (!dateString.trim()) return '';

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    const cleanInput = dateString.trim().toLowerCase();

    const datePatterns = [
      // MM/DD/YYYY or MM/DD/YY
      /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/,
      // MM-DD-YYYY or MM-DD-YY
      /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/,
      // YYYY/MM/DD
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
      // YYYY-MM-DD (already standard)
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      // DD/MM/YYYY or DD/MM/YY
      /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/,
      // DD-MM-YYYY or DD-MM-YY
      /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/,
    ];

    for (const pattern of datePatterns) {
      const match = cleanInput.match(pattern);
      if (match) {
        let year, month, day;

        if (pattern === datePatterns[0] || pattern === datePatterns[1]) {
          [, month, day, year] = match;
        } else if (pattern === datePatterns[2] || pattern === datePatterns[3]) {
          [, year, month, day] = match;
        } else if (pattern === datePatterns[4] || pattern === datePatterns[5]) {
          [, day, month, year] = match;
        }

        year = year.length === 2 ? (parseInt(year) > 50 ? 1900 + parseInt(year) : 2000 + parseInt(year)) : parseInt(year);
        month = parseInt(month) - 1; // JS months are 0-based
        day = parseInt(day);

        const date = new Date(year, month, day);
        if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
          return `${year.toString().padStart(4, '0')}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
      }
    }

    if (cleanInput === 'today' || cleanInput === 'now') {
      return `${currentYear.toString().padStart(4, '0')}-${(currentMonth + 1).toString().padStart(2, '0')}-${currentDate.toString().padStart(2, '0')}`;
    }

    if (cleanInput === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(currentDate + 1);
      return `${tomorrow.getFullYear().toString().padStart(4, '0')}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${tomorrow.getDate().toString().padStart(2, '0')}`;
    }

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = dayNames.indexOf(cleanInput);
    if (dayIndex !== -1) {
      const targetDate = new Date(today);
      const currentDay = today.getDay();
      let daysToAdd = dayIndex - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7; // Next occurrence
      targetDate.setDate(currentDate + daysToAdd);
      return `${targetDate.getFullYear().toString().padStart(4, '0')}-${(targetDate.getMonth() + 1).toString().padStart(2, '0')}-${targetDate.getDate().toString().padStart(2, '0')}`;
    }

    return ''; // Invalid date
  };

export const parseTime = (timeString) => {
    if (!timeString.trim()) return '';

    const cleanInput = timeString.trim().toLowerCase().replace(/\s+/g, '');

    const timePatterns = [
      // HH:MM (already standard)
      /^(\d{1,2}):(\d{2})$/,
      // HH:MM AM/PM
      /^(\d{1,2}):(\d{2})(am|pm)$/,
      // HHMM
      /^(\d{1,2})(\d{2})$/,
      // HH AM/PM or H AM/PM
      /^(\d{1,2})(am|pm)$/,
      // HH.MM
      /^(\d{1,2})\.(\d{2})$/,
    ];

    for (const pattern of timePatterns) {
      const match = cleanInput.match(pattern);
      if (match) {
        let hours, minutes, period = '';

        if (pattern === timePatterns[0]) {
          [, hours, minutes] = match;
        } else if (pattern === timePatterns[1]) {
          [, hours, minutes, period] = match;
        } else if (pattern === timePatterns[2]) {
          [, hours, minutes] = match;
        } else if (pattern === timePatterns[3]) {
          [, hours, period] = match;
          minutes = '00';
        } else if (pattern === timePatterns[4]) {
          [, hours, minutes] = match;
        }

        hours = parseInt(hours);
        minutes = parseInt(minutes || 0);

        if (period && (hours < 1 || hours > 12)) continue;
        if (period === 'pm' && hours !== 12) {
          hours += 12;
        } else if (period === 'am' && hours === 12) {
          hours = 0;
        }

        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
      }
    }

    const timeWords = {
      'noon': '12:00',
      'midnight': '00:00',
      'morning': '09:00',
      'afternoon': '14:00',
      'evening': '18:00',
      'night': '20:00',
    };

    if (timeWords[cleanInput]) {
      return timeWords[cleanInput];
    }

    return ''; // Invalid time
  };
