import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import FilterChipGroup from '../components/FilterChipGroup';
import ImportExcelCard from '../components/ImportExcelCard';
import SectionTitle from '../components/SectionTitle';
import PersonRecordCard from '../components/PersonRecordCard';

import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing } from '../styles/globalStyles';
import { YEARS, getSectionOptions } from '../config/sectionsConfig';

// ---------------------------------------------------------------------------
// Dummy data (no backend / no API calls)
// ---------------------------------------------------------------------------

const INITIAL_STUDENTS = [
  {
    id: 's1',
    name: 'Aarav Sharma',
    registerNumber: '2024CSE024',
    department: 'CSE',
    year: '1st Year',
    section: 'A',
    deviceStatus: 'Connected',
    isBlocked: false,
  },
  {
    id: 's2',
    name: 'Meera Krishnan',
    registerNumber: '2024CSE007',
    department: 'CSE',
    year: '1st Year',
    section: 'B',
    deviceStatus: 'Not Connected',
    isBlocked: false,
  },
  {
    id: 's3',
    name: 'Rohan Verma',
    registerNumber: '2023ECE011',
    department: 'ECE',
    year: '2nd Year',
    section: 'A',
    deviceStatus: 'Connected',
    isBlocked: true,
  },
  {
    id: 's4',
    name: 'Sneha Pillai',
    registerNumber: '2023ECE018',
    department: 'ECE',
    year: '2nd Year',
    section: 'C',
    deviceStatus: 'Connected',
    isBlocked: false,
  },
  {
    id: 's5',
    name: 'Karthik Jayan',
    registerNumber: '2022MECH029',
    department: 'MECH',
    year: '3rd Year',
    section: 'B',
    deviceStatus: 'Not Connected',
    isBlocked: false,
  },
  {
    id: 's6',
    name: 'Divya Menon',
    registerNumber: '2022MECH005',
    department: 'MECH',
    year: '3rd Year',
    section: 'D',
    deviceStatus: 'Connected',
    isBlocked: true,
  },
  {
    id: 's7',
    name: 'Farhan Ali',
    registerNumber: '2021CSE041',
    department: 'CSE',
    year: '4th Year',
    section: 'A',
    deviceStatus: 'Connected',
    isBlocked: false,
  },
  {
    id: 's8',
    name: 'Anjali Rao',
    registerNumber: '2021CSE036',
    department: 'CSE',
    year: '4th Year',
    section: 'C',
    deviceStatus: 'Not Connected',
    isBlocked: false,
  },
];

const getInitials = (name) =>
  name.split(' ').map((part) => part.charAt(0)).join('').slice(0, 2).toUpperCase();

const StudentsScreen = () => {
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');

  const yearOptions = useMemo(() => ['All', ...YEARS], []);
  const sectionOptions = useMemo(
    () => ['All', ...getSectionOptions(selectedYear)],
    [selectedYear],
  );

  // If switching years makes the currently selected section unavailable
  // (e.g. a year configured with fewer sections), reset it back to "All".
  useEffect(() => {
    if (selectedSection !== 'All' && !sectionOptions.includes(selectedSection)) {
      setSelectedSection('All');
    }
  }, [sectionOptions, selectedSection]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear = selectedYear === 'All' || student.year === selectedYear;
      const matchesSection = selectedSection === 'All' || student.section === selectedSection;
      return matchesSearch && matchesYear && matchesSection;
    });
  }, [students, searchQuery, selectedYear, selectedSection]);

  const handleToggleBlock = (studentId) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, isBlocked: !student.isBlocked } : student,
      ),
    );
  };

  const handleImportPress = () => {
    // Intentionally left as a no-op: UI only, ready for file-picker/backend integration.
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Header title="Students" subtitle="Manage student records" />

      <View style={styles.section}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search students"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.filterLabel}>Year</Text>
        <FilterChipGroup
          options={yearOptions}
          selectedValue={selectedYear}
          onSelect={setSelectedYear}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.filterLabel}>Section</Text>
        <FilterChipGroup
          options={sectionOptions}
          selectedValue={selectedSection}
          onSelect={setSelectedSection}
        />
      </View>

      <View style={styles.section}>
        <ImportExcelCard
          title="Import Student Excel (.xlsx)"
          subtitle="Bulk add students from a spreadsheet"
          onPress={handleImportPress}
        />
      </View>

      <View style={styles.section}>
        <SectionTitle
          title={`All Students (${filteredStudents.length})`}
          subtitle="Tap Block or Unblock to manage device access"
        />
        {filteredStudents.length === 0 ? (
          <Text style={styles.emptyText}>No students match your filters.</Text>
        ) : (
          filteredStudents.map((student) => (
            <PersonRecordCard
              key={student.id}
              avatarText={getInitials(student.name)}
              name={student.name}
              idLabel="Register No."
              idValue={student.registerNumber}
              department={student.department}
              year={student.year}
              section={student.section}
              deviceStatus={student.deviceStatus}
              isBlocked={student.isBlocked}
              onToggleBlock={() => handleToggleBlock(student.id)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxxl },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  filterLabel: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});

export default StudentsScreen;