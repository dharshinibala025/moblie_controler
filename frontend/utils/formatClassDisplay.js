/**
 * Shared utility to format class assignment string for display.
 * e.g. "CSE-2-D" -> "2nd Year CSE - Section D"
 *       "III CSE - A" -> "3rd Year CSE - Section A"
 */
const formatClassDisplay = (assignedClass) => {
  if (!assignedClass) return 'No Class Assigned';

  if (assignedClass.includes('-') && !assignedClass.includes(' - ')) {
    const parts = assignedClass.split('-');
    if (parts.length === 3) {
      const dept = parts[0];
      const yearVal = parts[1];
      const section = parts[2];

      let yearText = `${yearVal}th Year`;
      if (yearVal === '1') yearText = '1st Year';
      else if (yearVal === '2') yearText = '2nd Year';
      else if (yearVal === '3') yearText = '3rd Year';
      else if (yearVal === '4') yearText = '4th Year';

      return `${yearText} ${dept} - Section ${section}`;
    }
  }

  const parts = assignedClass.split(' - ');
  const classPart = parts[0];
  const section = parts[1] || '';

  let yearText = '';
  if (classPart.startsWith('III')) {
    yearText = '3rd Year';
  } else if (classPart.startsWith('II')) {
    yearText = '2nd Year';
  } else if (classPart.startsWith('IV')) {
    yearText = '4th Year';
  } else if (classPart.startsWith('I')) {
    yearText = '1st Year';
  } else {
    yearText = classPart;
  }

  const deptPart = classPart.replace(/^[IVX\s]+/, '').trim();

  return `${yearText} ${deptPart}${section ? ` - Section ${section}` : ''}`;
};

export default formatClassDisplay;
